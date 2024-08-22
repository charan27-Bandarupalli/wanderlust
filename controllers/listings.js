require('dotenv').config();
const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

// Check if the mapToken is set properly
const mapToken = process.env.MAP_TOKEN;
console.log("MAP_TOKEN",process.env.MAP_TOKEN);

if (!mapToken) {
    console.error('Error: Mapbox access token is missing. Please set the map_Token environment variable.');
    process.exit(1); // Exit the application if the token is not set
}

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });

module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while fetching listings.");
        res.redirect("/listings");
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    try {
        let { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({ path: "reviews", populate: { path: "author" } })
            .populate("owner");
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }
        console.log(listing.reviews);
        res.render("listings/show.ejs", { listing });
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while fetching the listing.");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res, next) => {
    try {
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        }).send();

        let url = req.file.path;
        let filename = req.file.filename;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };

        newListing.geometry = response.body.features[0].geometry;

        let savedListing = await newListing.save();
        console.log(savedListing);
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while creating the listing.");
        res.redirect("/listings");
    }
};

module.exports.renderEditForm = async (req, res) => {
    try {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }

        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        res.render("listings/edit.ejs", { listing, originalImageUrl });
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while fetching the listing.");
        res.redirect("/listings");
    }
};

module.exports.updateListing = async (req, res) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

        if (typeof req.file !== "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = { url, filename };
            await listing.save();
        };

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while updating the listing.");
        res.redirect("/listings");
    }
};

module.exports.destroyListing = async (req, res) => {
    try {
        let { id } = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while deleting the listing.");
        res.redirect("/listings");
    }
};
