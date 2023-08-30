const MongoClient=require('mongodb').MongoClient
var state={

    db:null

}

module.exports.connect=(done)=>{

    const url="mongodb://0.0.0.0:27017"
    const dbname="test-ecommerce"

    MongoClient.connect(url,{useUnifiedTopology:true},(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
    done()
    })
}

module.exports.get=()=>{
    return state.db
}
