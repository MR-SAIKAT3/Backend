import express from 'express';

const app = express();
const port = 3000;
app.use(express.json())

let teaData = [];
let nextId = 1;

// create tea

app.post('/teas', (req, res) => {
    const {name, price} = req.body; 
    const newTea = {id: nextId++, name, price}
    teaData.push(newTea)
    res.status(201).send(newTea)
});

// get tea

app.get('/teas', (req, res) => {
    res.status(200).send(teaData)
})

app.get('/teas/:id', (req, res) => {
    const tea = teaData.find(t => t.id === parseInt(req.params.id));
    if (!tea) {
        return res.status(404).send(`404 not found!`)
    };
    res.status(200).send(tea)
});

// update tea

app.put('/teas/:id', (req, res) => {
  const tea = teaData.find((t) => t.id === parseInt(req.params.id));
  if (!tea) {
    return res.status(404).send(`404 not found!`);
  }
  const { name, price } = req.body;
  tea.name = name;
  tea.price = price;
  res.status(200).send(tea)
})

// delete tea

app.delete('/teas/:id', (req, res) => {
    const teaIndex = teaData.findIndex((t) => t.id === parseInt(req.params.id));
    if (teaIndex === -1) {
      return res.status(404).send(`404 not found!`);
    }
    teaData.splice(teaIndex, 1);
    return res.status(200).send('Delete tea')
})

app.listen(port, () => {
    console.log(`Server is running at port: $${port}...`); 
})