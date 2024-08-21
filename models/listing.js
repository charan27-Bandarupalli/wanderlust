const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    }, 

    price: Number,
    location: String,
    country: String,
    reviews: [
        {
          type: Schema.Types.ObjectId,
          ref: "Review",
        },
    ],

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
          coordinates: {
            type: [Number],
            required: true
        },
    },
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({_id: { $in: listing.reviews }});
    }
});


//"https://www.pexels.com/photo/coconut-tree-near-body-of-water-under-blue-sky-240526/"  (ours)
//https://images.pexels.com/photos/240526/pexels-photo-240526.jpeg (gpt)

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;