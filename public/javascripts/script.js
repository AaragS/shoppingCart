function viewImage(event){
    document.getElementById('imageView').src=URL.createObjectURL(event.target.files[0])
}

function AddToCart(proId){
    $.ajax(
        {
            url:'/add-to-cart/'+proId,
            method:'get',
            success:(response)=>{
        
                  if(response.status){
                      let count=$('#cart-count').html()
                      count=parseInt(count) + 1
                      $('#cart-count').html(count)
                 }
                
            }
        }
    )
}



function changeQuantity(cartId,proId,userId,count){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    $.ajax(
        {
            url:'/change-product-quantity/'+userId,
            data:{

                user:userId,
                cart:cartId,
                product:proId,
                count:count,
                quantity:quantity
            },
            method:'post',
            success:(response)=>{
              if(response.remove){
                alert('Item removed from cart')
                location.reload()
              }else{
                console.log('%^$^',response.total)
                document.getElementById(proId).innerHTML=quantity+count
                document.getElementById('total').innerHTML=response.total
              }
            }
        }
    )
}




function deleteCartItem(cartId,proId){
    $.ajax(
        {
        url:'/delete-cart-item',
        data:{
            cart:cartId,
            product:proId
        },
        method:'post',
        success:(response)=>{
            console.log(response);
            alert('item removed from cart')
            location.reload()


        }
        })
}

//script from place order

$('#checkout-form').submit((e)=>{
    e.preventDefault();
    $.ajax(
        {
            url:'place-order',
            method:'post',
            data:$('#checkout-form').serialize(),
            success:(response)=>{
                  
                if(response.codSuccess){
                   
                    location.href='/order-placed'
                }else if(response){
                   
                    razorpayPayment(response)
                    console.log('4')
                }else{
                    console.log('eror in ajx of chekout form')
                }
                
            }

        }
    )
})

function razorpayPayment(order){
    console.log('5')
    var options = {
        "key": "rzp_test_xotNBQxMIGurKl", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Acmme",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
         //   alert(response);
          //  alert(response.razorpay_order_id);
            //alert(response.razorpay_signature)
           // console.log(response)
            verifyPayment(response,order)
        },

        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gAurav.kumar@example.com",
            "contact": "9000090000"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
       
    };
    var rzp1 = new Razorpay(options);
    rzp1.open()

}

function verifyPayment(payment,order){
    console.log('6')
    $.ajax(
        {
            url:'/verify-payment',
            data:{
                payment,order
            },
            method:'post',
            success:(response)=>{

                if(response.status) {
                    console.log(response.status)
                    location.href='/order-placed'
                }else{
                    console.log('error')
                }


            }
            
        }
    )
}