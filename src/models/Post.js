const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      trim: true
      // Removed minlength constraint to allow empty content when image is provided
    },
    image: {
      type: String, // URL to the uploaded image
      default: null
    },
    hashtags: [
      {
        type: String,
        lowercase: true
      }
    ],

    date: {
      type: Date,
      default: Date.now
    },
    edited: {
      type: Boolean,
      default: false
    },
    lastEdited: {
      type: Date,
      default: null
    },
    likesCount: {
      type: Number,
      default: 0
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
      }
    ],
    comments: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        content: {
          type: String,
          required: true,
          trim: true,
          minlength: [1, 'Comment content cannot be empty']
        },
        date: {
          type: Date,
          default: Date.now
        },
        parentComment: {
          type: Schema.Types.ObjectId,
          default: null
        },
        edited: {
          type: Boolean,
          default: false
        },
        editedAt: {
          type: Date,
          default: null
        },
        likesCount: {
          type: Number,
          default: 0
        },
        likedBy: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        ]
      }
    ],
    visibility: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'public'
    },
    commentCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Validation to ensure at least content or image is provided
postSchema.pre('save', function(next) {
  if (!this.content && !this.image) {
    const error = new Error('At least content or image is required');
    return next(error);
  }
  next();
});

// postSchema.virtual('commentCount').get(function () {
//   return this.comments.length;
// });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
