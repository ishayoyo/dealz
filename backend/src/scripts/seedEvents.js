require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const TrackingEvent = require('../models/TrackingEvent.Model');
const config = require('../config/config');

mongoose.connect(config.mongoose.url, config.mongoose.options)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

const predefinedEvents = [
  {
    name: 'SignUp',
    description: 'Tracks when a user signs up',
    pixelUrl: ''
  },
  {
    name: 'DealModalOpen',
    description: 'Tracks when a user opens a deal modal',
    pixelUrl: ''
  },
  {
    name: 'GetThisDealClick',
    description: 'Tracks when a user clicks the "Get This Deal" button',
    pixelUrl: ''
  }
];

async function seedEvents() {
  try {
    for (const event of predefinedEvents) {
      const result = await TrackingEvent.findOneAndUpdate(
        { name: event.name },
        event,
        { upsert: true, new: true }
      );
      console.log(`Upserted event: ${result.name}`);
    }
    console.log('Finished seeding events');
  } catch (error) {
    console.error('Error seeding events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedEvents();
