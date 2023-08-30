var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var ObjectId = require('mongodb').ObjectId

//razorPay
var Razorpay= require('razorpay')
const { log } = require('console')
var instance = new Razorpay({
    key_id: 'rzp_test_xotNBQxMIGurKl',
    key_secret: 'M4Ar93mBKwrSc6iGk731t5Ca',
  });

module.exports = {

    doSignUp: (user_data) => {

        return new Promise(async (resolve, reject) => {
            user_data.password = await bcrypt.hash(user_data.password, 10)

            db.get().collection(collection.USER_COLLECTION).insertOne(user_data).then((data) => {
                resolve(data.ops[0])
            })



        })

    },

    doLogin: (user_data) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: user_data.email })

            if (user) {

                bcrypt.compare(user_data.password, user.password).then((result) => {
                    if (result) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {

                resolve({ status: false })

            }
        })
    },
    addToCart: (proId, userId) => {

        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }


        return new Promise(async (resolve, reject) => {

            let usercart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (usercart) {
                let proExist = usercart.products.findIndex(product => product.item == proId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ 'products.item': ObjectId(proId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })
                } else {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId) }, {

                            $push: { products: proObj }

                        }).then((response) => {
                            resolve(response)
                        })

                }

            } else {
                let cartobj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve()
                })
            }



        })

    },
    getCartDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let CartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) },
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(CartItems[0]);
            resolve(CartItems)
        })
    },
    getCartCount: (userId) => {

        return new Promise(async (resolve, reject) => {



            let usercart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            let count = 0
            if (usercart) {
                count = usercart.products.length

            }
            resolve(count)
        })



    },
    changeProductQuantity: (details) => {

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) }, {
                    $pull: { products: { item: ObjectId(details.product) } }
                }).then((response) => {
                    resolve({ remove: true })
                })
            } else {


                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) }, {
                    $inc: { 'products.$.quantity': details.count }
                }).then((response) => {
                    resolve({status:true})
                })
            }
        })
    },
    DeleteCartItem: (details) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) }, {
                $pull: { products: { item: ObjectId(details.product) } }
            }).then((response) => {
                resolve(response)
            })
        })

    },

    getTotal:(userId)=>{
        return new Promise(async(resolve, reject) => {

            let Total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) },
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group:{ 
                        _id:null, 
                        total:{ $sum: { $multiply: [ '$quantity',{ $toInt:'$product.Price' } ] } } 
                    }
                }
            ]).toArray()

           
            resolve(Total[0].total)
            
        })
    },
    getProductList:(userId)=>{

        console.log('user id ',userId);


        return new Promise(async(resolve, reject) => {
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
           
           resolve(cart.products)
        })
       

    },

    placeOrder:(order,product,total)=>{

            return new Promise((resolve, reject) => {   

          let status=order['payment-method']==='COD'?'Placed':'Pending' 
          let orderObj={
            deliveryDetails:{
                address:order.address,
                pincode:order.pincode,
                mobile:order.mobile
            },
            userId:ObjectId(order.userId),
            product:product,
            totalPrice:total,
            status:status,
            paymentMethod:order['payment-method'],
            date: new Date()
          }
          db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
               db.get().collection(collection.CART_COLLECTION).removeOne({user:ObjectId(order.userId)})
            resolve(response.ops[0]._id)
          })
        })
    },

   
    getOrderDetails:(userId)=>{

        return new Promise(async(resolve, reject) => {
            
            let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderedProducts:(orderId)=>{
        console.log('order ID :',orderId)
        return new Promise(async(resolve, reject) => {
           
            let orderedItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) },
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()

            console.log('Ordered Items :',orderedItems)
          
            resolve(orderedItems)
        })
    },

    generateRazorpay:(orderId,total)=>{
        
       
        return new Promise((resolve, reject) => {
            console.log('2')
            var options = {
                amount:total*100,
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                if(err){
                    console.log(err)
                }else{
                console.log(order);
                resolve(order)
                }
              });
        })
    },
    verifyPayment:(details)=>{
        console.log(details);
        return new Promise((resolve, reject) => {
            const crypto=require('crypto')
            let hmac=crypto.createHmac('sha256','M4Ar93mBKwrSc6iGk731t5Ca')

        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
        })
        

    },
    changeStatus:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        
        })
    }
   

}