// Mock Profile model for development mode
class Profile {
  static async findById(id) {
    console.log(`[DEV] Looking up profile with ID: ${id}`);
    // Return a mock profile
    return {
      _id: id,
      user: 'dev-user-123',
      name: 'Development Profile',
      company: 'Dev Company',
      website: 'https://example.com',
      bio: 'This is a development profile for testing',
      skills: ['JavaScript', 'Node.js', 'React'],
      createdAt: new Date(),
      updatedAt: new Date(),
      toString: function() { return this._id; }
    };
  }
}

module.exports = Profile; 