const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const Dietary_restriction = require('../db/models/Dietary_restriction')

module.exports = (db) => {

  router.get("/", async (req, res) => {

  })

  return router;
};