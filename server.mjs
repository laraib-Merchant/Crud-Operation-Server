import express from "express";
import { MongoClient } from "mongodb";
import cors from 'cors';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890', 20);
import './config/index.mjs';

const app = express();
app.use(express.json());
app.use(cors());


async function connect() {
  try {
    
    const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.yqozuhy.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Conneted successfully");
    const dbName = "ecom";
    const dbCollection = "products";
    const db = client.db(dbName);
    const col = db.collection(dbCollection);
    return col;
  } catch(error) {
    console.log(`Error Occured: ${error}`);
  }
}


app.get("/", (req, res) => {
  res.send("hello world!");
});



// let products = [
//   {
//     id: nanoid(), // always a number
//     name: "abc product",
//     price: "$23.12",
//     description: "abc product description"
//   }
// ];

app.get("/products", async (req, res) => {

  const dbcol = await connect();
  const cursor = await dbcol.find({}); // An empty filter to retrieve all documents
  const products = await cursor.toArray(); // Convert the cursor to an array of documents
  res.send({
    message: "all products",
    data: products
  });
});

//  https://baseurl.com/product/1231
app.get("/product/:id", async (req, res) => {
  console.log(typeof req.params.id)

  if (isNaN(req.params.id)) {
    res.status(403).send("invalid product id")
  }

  let isFound = false;
  const dbcol = await connect();
  const cursor =  await dbcol.findOne({ id: req.params.id });
  if(cursor) {
    isFound = true;
  }
  // for (let i = 0; i < products.length; i++) {
  //   if (products[i].id === req.params.id) {
  //     isFound = i;
  //     break;
  //   }
  // }

  if (isFound === false) {
    res.status(404);
    res.send({
      message: "product not found"
    });
  } else {
    res.send({
      message: "product found with id: " + req.params.id,
      data: cursor
    });
  }
});

app.post("/product", async (req, res) => {

  // {
  //   id: 212342, // always a number
  //   name: "abc product",
  //   price: "$23.12",
  //   description: "abc product description"
  // }


  if (!req.body.name
    || !req.body.price
    || !req.body.description) {

    res.status(403).send(`
      required parameter missing. example JSON request body:
      {
        name: "abc product",
        price: "$23.12",
        description: "abc product description"
      }`);
  }
  const productDocument = {
    id: nanoid(),
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
  };
  const dbcol = await connect();
  const result = await dbcol.insertOne(productDocument);

  // products.push({
  //   id: nanoid(),
  //   name: req.body.name,
  //   price: req.body.price,
  //   description: req.body.description,
  // });


  res.status(201).send({ message: "created product" });
});

app.put("/product/:id", async (req, res) => {

  if (
    !req.body.name
    && !req.body.price
    && !req.body.description) {

    res.status(403).send(`
      required parameter missing. 
      atleast one parameter is required: name, price or description to complete update
      example JSON request body:
      {
        name: "abc product",
        price: "$23.12",
        description: "abc product description"
      }`);
  }


  let isFound = false;

  const dbcol = await connect();
  const filter = {id: req.params.id};
  const update = {
    $set: {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description
    }};
  const options = { returnDocument: 'after'};
  //const result = await dbcol.updateOne(filter, update);
  const updatedProduct = await dbcol.findOneAndUpdate(filter,update,options);
  if(updatedProduct) {
    isFound = true;
  }
  // for (let i = 0; i < products.length; i++) {
  //   if (products[i].id === req.params.id) {
  //     isFound = i;
  //     break;
  //   }
  // }

  if (isFound === false) {
    res.status(404);
    res.send({
      message: "product not found"
    });
  } else {

    // if (req.body.name) products[isFound].name = req.body.name
    // if (req.body.price) products[isFound].price = req.body.price
    // if (req.body.description) products[isFound].description = req.body.description

    res.send({
      message: "product is updated with id: " + req.params.id,
      data: updatedProduct
    });
  }
});

app.delete("/product/:id", async (req, res) => {

  let isFound = false;

  const dbcol = await connect();
  const filter = {id: req.params.id};
  const result = await dbcol.deleteOne(filter);
  if(result.deletedCount > 0) {
    isFound = true;
  }
  // for (let i = 0; i < products.length; i++) {
  //   if (products[i].id === req.params.id) {
  //     isFound = i;
  //     break;
  //   }
  // }

  if (isFound === false) {
    res.status(404);
    res.send({
      message: "product not found"
    });
  } else {
    //products.splice(isFound, 1)

    res.send({
      message: "product is deleted"
    });
  }
});




const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});