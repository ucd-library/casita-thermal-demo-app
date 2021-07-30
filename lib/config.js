let env = process.env.APP_ENV || 'dev';
let clientPackage = require('../client/public/package.json');

module.exports = {
  dataServer : {
    url : process.env.DATA_SERVER_URL || 'https://data.casita.library.ucdavis.edu',
    thermalApiPath : '/_/thermal-anomaly'
  },

  server : {
    assets : (env === 'prod') ? 'dist' : 'public',
    appRoutes : ['map', 'about'],
    port : process.env.APP_PORT || process.env.PORT || 3000,
  },
  
  client : {
    gaCode : process.env.GOOGLE_ANALYTICS || '',
    versions : {
      bundle : clientPackage.version,
      loader : clientPackage.dependencies['@ucd-lib/cork-app-load'].replace(/^\D/, '')
    }
  }
}