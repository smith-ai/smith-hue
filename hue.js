const axios = require('axios');

class Hue {
    constructor(address) {
        this.address = address;
    }

    static async discover() {
        const result = await axios.get('https://discovery.meethue.com');

        if (result.data.length === 0) throw new Error('Unable to discover Hue Bridge on network');

        return result.data[0];
    }

    static async register(address, devicetype) {
        const result = await axios.post(address, { devicetype });

        if (result.data.length === 0) throw new Error('Unable to register to Bridge API');

         return result.data[0];
    }

    async doRequest(method, uri, params) {
        const options = {
            method,
            url: `${this.address}${uri}`,
        };
    
        if (params !== null) {
            method === 'get'
                ? options.params = params
                : options.data = params;
        }
    
        try {
            const result = await axios(options);
    
            return result.data;
        } catch (err) {
            console.error(err);
    
            return false;
        }
    }

    async getLights() {
        return this.doRequest('get', '/lights');
    }

    async setLightState(id, params) {
        return this.doRequest('put', `/lights/${id}/state`, params);
    }

    async getLightByName(name) {
        const lights = await this.getLights();

        const lightKey = Object.keys(lights).filter((key) => {
            const light = lights[key];

            return light.name.toLowerCase() === name.toLowerCase();
        });

        if (lightKey.length === 0) {
            return false;
        }

        const id = lightKey[0];

        const light = lights[id];
        light.id = id;

        return light;
    }

    async toggleLight(name, on) {
        const light = await this.getLightByName(name);

        if (!light) {
            return false;
        }

        await this.setLightState(light.id, { on });

        return true;
    }

    async toggleAllLights(on) {
        const lights = await this.getLights();

        const lightIds = Object.keys(lights);

        for (let i = 0; i < lightIds.length; i++) {
            const id = lightIds[i];

            await this.setLightState(id, { on });
        }

        return true;
    }

    async changeLightBrightness(name, brighten) {
        const light = await this.getLightByName(name);

        if (!light || (!brighten && light.state.bri === 1) || (brighten && light.state.bri === 254)) {
            return false;
        }

        let bri = brighten
            ? light.state.bri + 100
            : light.state.bri - 100;

        if (bri < 1) bri = 1;
        if (bri > 254) bri = 254;

        await this.setLightState(light.id, { bri });
        
        return true;
    }
}

module.exports = Hue;