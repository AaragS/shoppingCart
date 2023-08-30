var express = require('express');
const { log } = require('handlebars');
var router = express.Router();
var ProductHelper=require('../helpers/product-helper');
const productHelper = require('../helpers/product-helper');

/* GET users listing. */

router.get('/', function(req, res, next) {
  
  productHelper.getAllProducts().then((products)=>{
    res.render('admin/view-products',{products,admin:true})
  })

  
});

router.get('/add-products',(req,res)=>{

  res.render('admin/add-products',{admin:true})
})

router.post('/add-products',(req,res)=>{

  productHelper.addProduct(req.body,(Id)=>{
    let image=req.files.Image
    image.mv('./public/product-images/'+Id+'.jpg',(err,data)=>{
      if(err){
        console.log('error:'+err)
      }else{
        res.render('admin/add-products' ,{admin:true} )
      }
    })
  })})

  router.get('/delete-product/:id',(req,res)=>{

    let proId=req.params.id
    ProductHelper.deleteProduct(proId).then((response)=>{
      res.redirect('/admin/')
    })
    

  })

  router.get('/edit-products/:id',(req,res)=>{
    let proID=req.params.id

    productHelper.getProductDetails(proID).then((product)=>{
      res.render('admin/edit-products',{product})
    })

  })

  router.post('/edit-products/:id',(req,res)=>{
   
    productHelper.editProduct(req.params.id,req.body).then(()=>{
      res.redirect('/admin')
      let image=req.files.Image
      let Id=req.params.id
      if(image){
        image.mv('./public/product-images/'+Id+'.jpg')
        
      }

    })

  })
module.exports = router;
