/** @type Egg.EggPlugin */
module.exports = {
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },
  multipart: {
    enable: true,
    package: 'egg-multipart',
  },
  dotenv: {
    enable: true,
    package: 'egg-dotenv',
  },
  session: {
    enable: true,
    package: 'egg-session',
  },
};
