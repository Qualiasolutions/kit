const mongoose = require('mongoose');

const IndustrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an industry name'],
    unique: true,
    trim: true
  },
  niches: [{
    name: {
      type: String,
      required: [true, 'Please add a niche name'],
      trim: true
    }
  }]
});

module.exports = mongoose.model('Industry', IndustrySchema); 