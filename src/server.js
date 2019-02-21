const express = require('express');
const app = express();

// settings
app.set('port', process.env.PORT || 3001);

// start the server
const server = app.listen(app.get('port'), () => {
  console.log('Server listening on port', app.get('port'));
});