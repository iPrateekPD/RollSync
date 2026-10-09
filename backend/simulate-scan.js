const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io');

client.on('connect', () => {
  console.log('Connected, publishing...');
  client.publish('classroom/RDB-6/rfid', JSON.stringify({
    uid: '264A1507',
    name: 'PD',
    timestamp: new Date().toISOString()
  }), (err) => {
    if (err) console.error(err);
    else console.log('Message sent!');
    client.end();
  });
});
