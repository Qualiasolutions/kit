const mongoose = require('mongoose');

const BusinessProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: [true, 'Please add a business name']
  },
  industry: {
    type: String,
    required: [true, 'Please select an industry']
  },
  niche: {
    type: String,
    required: [true, 'Please select a niche']
  },
  logo: {
    type: String,
    default: 'no-logo.png'
  },
  brandColors: {
    primary: {
      type: String,
      default: '#000000'
    },
    secondary: {
      type: String,
      default: '#ffffff'
    },
    accent: {
      type: String,
      default: '#cccccc'
    }
  },
  businessVoice: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 2;
      },
      message: 'You can select up to 2 business voice options'
    }
  },
  targetAudience: {
    type: [String],
    required: [true, 'Please define your target audience']
  },
  locationType: {
    type: String,
    enum: ['physical', 'online', 'service-area'],
    required: [true, 'Please select a location type']
  },
  location: {
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    cities: [String],
    online: Boolean
  },
  website: String,
  contactDetails: {
    phone: String,
    email: String
  },
  socialPlatforms: {
    type: Object,
    required: [true, 'Please select at least one social platform']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BusinessProfile', BusinessProfileSchema); 