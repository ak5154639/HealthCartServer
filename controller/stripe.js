require('dotenv').config();
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_API_KEY}`);

const DOMAIN= `${process.env.MY_DOMAIN}`;

createCheckoutSession = async (req,res)=>{
    const session = await stripe.checkout.session.create({
        customer_email:`${req.email}`,      
        submit_type:'pay',                  //Others: donate,pay,book,installment,subscription
        billing_address_collection:'auto',  
        shipping_address_collections:{      
            allowed_countries:['IN'],       
        },
        line_items:[
            {
                name:`${req.productName}`,
                
                price:`${req,price_id}`,
                quantity:req.quantity,
            },
        ],
        mode:'payment',                     //Others: setup, subscription
        success_url:`${DOMAIN}?success=true`,//
        cancel_url:`${DOMAIN}?cancelled=true`,//
        automatic_tax:{
            enabled:true                     
        },
    });
}