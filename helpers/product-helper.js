var db=require('../config/connection')
var collection=require('../config/collection')
var ObjectId=require('mongodb').ObjectId

module.exports={

    addProduct:(product,callback)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId)
        })



    },

    getAllProducts:()=>{
        return new Promise((resolve,reject)=>{
            let products=db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
        
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{

            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:ObjectId(proId)}).then((response)=>{
               console.log(response);
                resolve(response)
            })

        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    editProduct:(proId,proData)=>{
        return new Promise((resolve, reject) => {
        
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(proId)},{
                $set:{
                    name:proData.name,
                    Company:proData.Company
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    }

}