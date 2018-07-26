'use strict';

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const { moviesPostRequestErrors } = require('./validation/requestValidation');

const router = express.Router();

const API_KEY = 'ca4e5415';
const URL = 'http://www.omdbapi.com';

// Load Movie model
require('../models/Movie');

const Movie = mongoose.model('movies');

// GET
router.get('/', (req, res) => {
  // fetch movies from DB and send response
  Movie.find({})
    .then(movies => res.json(movies));
});

// POST
router.post('/', (req, res) => {
  // validation
  const errors = moviesPostRequestErrors(req);
  if (errors.length !== 0) {
    return res.status(400).send({ errors });
  }

  const { title } = req.body;

  // fetch data from external API
  axios.get(URL, {
    params: {
      apikey: API_KEY,
      t: title,
    },
  })
    .then(async (apiRes) => {
      const {
        Response, Error, Title, Year, Released, Runtime, Genre,
      } = apiRes.data;

      // check if movie exists in external DB
      if (Response === 'False') return res.json({ error: Error });

      // chceck if movie already exists in own DB
      let movieExist = false;
      await Movie.findOne({ title: Title }, (err, movie) => {
        if (err) console.log(err);
        if (movie !== null) movieExist = true;
      });
      if (movieExist) return res.json({ error: 'Movie already exists in database!' });

      const movie = {
        title: Title,
        year: Year,
        released: Released,
        runtime: Runtime,
        genre: Genre,
      };
      // save to DB and send response
      new Movie(movie)
        .save((err, product) => {
          if (err) console.log(err);
          res.json(product);
        });
    })
    .catch(err => console.log(err));
});

module.exports = router;
