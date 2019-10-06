const { action, actions } = require('@smith-ai/smith-actions');
const Hue = require('./hue');

/**
 * Create a new instance of the Hue client for the
 * given Bridge API address.
 * 
 * @param {object} param0 Module config object containing the Bridge address to use
 */
const hue = ({ address }) => {
    return new Hue(address);
}

/**
 * Module install command that will attempt to auto-discover
 * and register with a Hue Bridge on the network. Returns a new
 * module config object containing the full address of the Bridge
 * API and username. This should be called by smith-api upon 
 * module installation.
 */
const install = async (output) => {
    // Find the IP of the Bridge on the network
    const discovery = await Hue.discover();

    const bridge = discovery.internalipaddress;

    const name = '@mr-smith/smith-hue';
    let address = `http://${bridge}/api`;

    // Try to register, this will not return anything yet, 
    // requiring user to press button on their Bridge
    await Hue.register(address, name);

    output.write('Press the button on your Hue Bridge');

    // Wait for user to press button on Bridge
    await new Promise(done => setTimeout(done, 10000));

    // Try registering again, this will return a new API username
    const register = await Hue.register(address, name);
    const { username } = register.success;

     address += `/${username}`;

     return {
         address
     };
};

action('turn off all lights', async (params, config) => {
    await hue(config).toggleAllLights(false);

    return 'Turned off all lights';
});

action('turn on all lights', async (params, config) => {
    await hue(config).toggleAllLights(true);

    return 'Turned on all lights';
});

action('turn on the', async (light, config) => {
    await hue(config).toggleLight(light, true);

    return `Turned on the light ${light}`;
});

action('turn off the', async (light, config) => {
    await hue(config).toggleLight(light, false);

    return `Turned off the light ${light}`;
});

action('dim', async (light, config) => {
    await hue(config).changeLightBrightness(light, false);

    return `Dimmed light ${light}`;
});

action('brighten', async (light, config) => {
    await hue(config).changeLightBrightness(light, true);

    return `Brightened light ${light}`;
});

module.exports = {
    actions,
    install,
};
