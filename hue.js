const axios = require('axios');

class Hue {
    /**
     * Constructor. Create a new Hue client specific
     * to the given Bridge API address.
     * 
     * @param {string} address Bridge API address to use
     */
    constructor(address) {
        this.address = address;
    }

    /**
     * Attempt to discover any Hue Bridges on the same network.
     * The discovery page should return a JSON array of bridges 
     * containing their corresponding IP addresses on the network.
     */
    static async discover() {
        const result = await axios.get('https://discovery.meethue.com');

        if (result.data.length === 0) throw new Error('Unable to discover Hue Bridge on network');

        return result.data[0];
    }

    /**
     * Make a 'registration' request to the given Bridge API address.
     * On the first call, this should fail, requiring the user to press
     * the button on their Bridge to authenticate, after which this
     * should be called again and return a new username to use with the API.
     * 
     * @param {string} address Bridge API address to call
     * @param {string} devicetype Name of device to create a new user for
     */
    static async register(address, devicetype) {
        const result = await axios.post(address, { devicetype });

        if (result.data.length === 0) throw new Error('Unable to register to Bridge API');

         return result.data[0];
    }

    /**
     * Reusable helper method for making a Bridge API request.
     * 
     * @param {string} method Request method to make a request with (i.e. GET, POST etc)
     * @param {string} uri URI of API endpoint to call
     * @param {object} params Parameters to include in the request
     */
    async doRequest(method, uri, params) {
        const options = {
            method,
            url: `${this.address}${uri}`,
        };
    
        if (params !== null) {
            // If this is a GET request, use the given parameters as
            // GET parameters, else use them as normal request data
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

    /**
     * Retrieve a JSON array of all Hue lights connected to
     * the Bridge.
     */
    async getLights() {
        return this.doRequest('get', '/lights');
    }

    /**
     * Change the state of a Hue light connected to the Bridge.
     * This can include such things as on/off, brightness, color etc.
     * 
     * @param {string} id ID of light to change
     * @param {object} params State parameters to change light to
     */
    async setLightState(id, params) {
        return this.doRequest('put', `/lights/${id}/state`, params);
    }

    /**
     * Retrieve a Hue light connected to the Bridge that
     * matches to the given name, instead of requiring a 
     * regular numeric ID.
     * 
     * @param {string} name Name of light to retrieve
     */
    async getLightByName(name) {
        // Retrieve all lights connected to the Bridge
        const lights = await this.getLights();

        // Attempt to filter lights down to those matching the given name
        const lightKey = Object.keys(lights).filter((key) => {
            const light = lights[key];

            return light.name.toLowerCase() === name.toLowerCase();
        });

        // If there are no lights, exit
        if (lightKey.length === 0) {
            return false;
        }

        // Get the first matching light and append 
        // the ID to the object for easy access
        const id = lightKey[0];
        const light = lights[id];
        light.id = id;

        return light;
    }

    /**
     * Turn a Hue light matching the given name on/off.
     * 
     * @param {string} name Name of light to toggle
     * @param {bool} on On/off status
     */
    async toggleLight(name, on) {
        const light = await this.getLightByName(name);

        if (!light) {
            return false;
        }

        await this.setLightState(light.id, { on });

        return true;
    }

    /**
     * Turn all Hue lights on/off.
     * 
     * @param {boolean} on On/off status
     */
    async toggleAllLights(on) {
        const lights = await this.getLights();

        const lightIds = Object.keys(lights);

        for (let i = 0; i < lightIds.length; i++) {
            const id = lightIds[i];

            await this.setLightState(id, { on });
        }

        return true;
    }

    /**
     * Increase/decrease the brightness of a Hue light.
     * 
     * @param {string} name Name of light to change
     * @param {boolean} brighten Brighten=true, dim=false
     */
    async changeLightBrightness(name, brighten) {
        const light = await this.getLightByName(name);

        // If there is no light, or the light cannot be 
        // any dimmer or brighter, exit
        if (!light || (!brighten && light.state.bri === 1) || (brighten && light.state.bri === 254)) {
            return false;
        }

        // If brightening, increase by 100 brightness,
        // else dimming, decrease by 100 brightness
        let bri = brighten
            ? light.state.bri + 100
            : light.state.bri - 100;

        // Reset to min/max brightness values if necessary
        if (bri < 1) bri = 1;
        if (bri > 254) bri = 254;

        await this.setLightState(light.id, { bri });
        
        return true;
    }
}

module.exports = Hue;