const { action, actions } = require('@smith-ai/smith-actions');
const Hue = require('./hue');

const hue = ({ address }) => {
    return new Hue(address);
}

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

module.exports = actions;