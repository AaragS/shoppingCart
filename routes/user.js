//modules
var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helper');
const userHelper = require('../helpers/user-helper')


//middleware
 var verifyLogin=(req,res,next)=>{
  if(req.session.user.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
 }

//routes

router.get('/', async function (req, res, next) {

  let user = req.session.user

  let cartCount=null
    if(req.session.user){
      
     cartCount=await userHelper.getCartCount(req.session.user._id)
      
    }
  
  productHelper.getAllProducts().then((products) => {
    
    res.render('user/view-product', { products, user,cartCount})
  })
});


router.get('/login', (req, res) => {
  if(req.session.user){
    res.redirect('/')
  }else{
  res.render('user/login',{'loginErr':req.session.userLoginErr})
  req.session.userLoginErr=false
  }

})

router.post('/login', (req, res) => {

  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr="Invalid Username or Password!"
      res.redirect('/login')
    }
  })
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})



router.post('/signup', (req, res) => {
  userHelper.doSignUp(req.body).then((data) => {
    if(data){
      req.session.user=data
      req.session.userLoggedIn = true
    res.redirect('/')
    }
  })

})

router.get('/logout', (req, res) => {
  req.session.user=null
  res.redirect('/login')

})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userHelper.getCartDetails(req.session.user._id)
  
  let total=await userHelper.getTotal(req.session.user._id)
  res.render('user/cart',{user:req.session.user,products,total})
  
})

  


router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call');
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    
   res.json({status:true})
  })
})

router.post('/change-product-quantity/:id',(req,res)=>{
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
   response.total=await userHelper.getTotal(req.params.id)
    
    res.json(response)  
  })
})

router.post('/delete-cart-item',(req,res)=>{
  console.log(req.body,' :now')
  userHelper.DeleteCartItem(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/place-order',verifyLogin, async(req,res)=>{
  let total=await userHelper.getTotal(req.session.user._id)
  console.log(total ,'now')
  res.render('user/place-order' ,{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  
  let products=await userHelper.getProductList(req.body.userId)
  let total=await userHelper.getTotal(req.body.userId)
  userHelper.placeOrder(req.body,products,total).then((orderId)=>{  
    console.log('1')
    if(req.body['payment-method']=='COD'){

    res.json({codSuccess:true})
    
    
    }else{
      userHelper.generateRazorpay(orderId,parseInt(total)).then((response)=>{

        
        res.json(response)
       
      })
      }
   
  })
})

router.get('/order-placed',verifyLogin,(req,res)=>{
  res.render('user/order-placed',{user:req.session.user})
})

router.get('/orders',verifyLogin,async(req,res)=>{
  let orders=await userHelper.getOrderDetails(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view-ordered-product/:id',verifyLogin,async(req,res)=>{
  let ordered_products=await userHelper.getOrderedProducts(req.params.id)
  res.render('user/view-ordered-product',{user:req.session.user,ordered_products})
})

router.post('/verify-payment',(req,res)=>{

  userHelper.verifyPayment(req.body).then((response)=>{
    userHelper.changeStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })

    

  }).catch((err)=>{
    res.json({status:false})
  })
})

module.exports = router;
