const express = require('express');
const router = express.Router();
const db = require('../models/index');
const getRestrictionObj = require('../helpers/getRestrictionObj');

// Replace with actual id from cookie
const userId = {
  id: 3,
}

module.exports = () => {

  router.post('/add-favourites', async (req, res) => {
    let { productName, api_id, productTags } = req.body


    const checkFavourites = await db.Favourite.findAll({
      raw: true,
      where: { name: productName }
    })

    if (checkFavourites.length === 0) {
      await db.Favourite.create({
        apiId: api_id,
        name: productName
      })

      const getFavouriteId = await db.Favourite.findAll({ raw: true, where: { name: productName } })

      const getRestrictionTags = await db.DietaryRestriction.findAll({ raw: true, attributes: ['id', 'name'] })

      const formatProductTags = productTags.map(product => {
        return product.split('_').join('-').toLowerCase()
      })

      const formatRestrictionTags = getRestrictionTags.map(tag => {
        const itemName = tag.name.toLowerCase().split(' ')
        if (itemName[1] === 'diet') {
          itemName.pop()
        }
        itemName.join('')
        return { name: itemName[0], id: tag.id }
      })

      const restrictionIds = []

      formatRestrictionTags.forEach(tag => {
        if (formatProductTags.includes(tag.name)) {
          restrictionIds.push(tag.id)
        }
      })

      const favouriteRestrictions = [];

      restrictionIds.forEach(item => {
        favouriteRestrictions.push({
          favouriteId: getFavouriteId[0].id,
          dietaryRestrictionId: item
        })
      })

      await db.FavouriteDietaryRestriction.bulkCreate(favouriteRestrictions)

    }

    const favouriteId = await db.Favourite.findAll({ raw: true, where: { name: productName } })


    const checkUserFavourites = await db.UserFavourite.findAll({
      raw: true,
      where: {
        userId: userId.id,
        favouriteId: favouriteId[0].id
      }
    })
    console.log(checkUserFavourites)

    if (checkUserFavourites.length === 0) {
      await db.UserFavourite.create({
        userId: userId.id,
        favouriteId: favouriteId[0].id
      })
      console.log('success')
    }
  })

  router.get('/user-favourites', async (req, res) => {
    let userFavourites = await db.User.findAll({
      raw: true, include: [{ model: db.Favourite }], where: { id: userId.id }
    })

    const userData = []
    userFavourites.forEach(product => {
      userData.push({
        productName: product['Favourites.name'],
        apiId: product['Favourites.apiId']
      })
    })
    res.send(userData)
  });


  router.get('/popular-products', async (req, res) => {
    const favouriteData = await db.UserFavourite.findAll({ raw: true })

    const countFavs = await db.UserFavourite.count({ raw: true, attributes: ['favouriteId'], group: ['UserFavourite.favouriteId'] })
    console.log(countFavs)






    // Model.count({
    //   where: { id: a model id },
    //   include: [Like]
    // });

    // return Model.findAll({
    //   attributes: ['id', [sequelize.fn('count', sequelize.col('likes.id')), 'likecount']],
    //   include: [{ attributes: [], model: Like }],
    //   group: ['model.id']
    // });
  })

  // Setting user dietary preferences
  router.post('/user-preferences', async (req, res) => {
    let { userId, selectedPreferences } = req.body

    // Create restrictions for the user, if they don't already have it
    const checkUserPreferences = await db.UserDietaryRestriction.findAll({ raw: true, where: { userId: userId } })
    const userPreferences = []
    checkUserPreferences.forEach(preference => userPreferences.push(preference.dietaryRestrictionId))

    selectedPreferences = selectedPreferences.filter(preference => !userPreferences.includes(preference))

    const userData = []
    selectedPreferences.forEach(preference => {
      userData.push({
        userId: userId,
        dietaryRestrictionId: preference
      })
    });

    await db.UserDietaryRestriction.bulkCreate(userData)

    // Send back their restrictions in the response
    const userRestrictionInfo = await db.User.findAll({
      raw: true,
      where: { id: userId },
      include: [db.DietaryRestriction]
    });

    const userRestrictions = getRestrictionObj(userRestrictionInfo);
    res.send({
      success: true,
      userRestrictions
    });
  })
  return router
}
