import { User } from "../persintence/models/User.js";

import { getUsers_, createUser_, getUser_, updateUser_, deleteUser_} from "../persintence/repository/user.repository.js";



/*s 

User controller

User controller se encarga de "comprobar" que las queries ejecutadas por las funciones en User repository a la base de datos funcionaron

Por ejemplo, getUsers recibe un id -> lo manda a getUsers_ [la del repository] -> esta manda la query a BD -> devuelve el estado y el objeto


*/




export function getUsers(req, res) {
  getUsers_().then(data => {
    res.status(200).json({status : true, data : data})
  }, error => {
    res.status(400).json({status : false, error : error.message })
  }) 
}

export  function createUser(req, res) {
  const { name, mail, password } = req.body;
  const user ={
    name, 
    mail,
    password
  }
  createUser_(user).then(data => {
    res.status(200).json({status : true, data : data})
  }, error => {
    res.status(400).json({status : false, error : error.message })
  })
    
}

export async function getUser(req, res) {
  const { id } = req.params;
  getUser_(id).then(data => {
    res.status(200).json({status : true, data : data})
  }, error => {
    res.status(400).json({status : false, error : error.message })
  })
  
}

export const updateUser = async (req, res) => {

  const { id } = req.params;
  const { name, mail, password } = req.body;
  const user ={
    id, 
    name, 
    mail,
    password
  }
  updateUser_(user).then(msg => {
    res.status(200).json({status : true, msg : msg })
  }, error => {
    res.status(400).json({status : false, error : error.message })
  })
  
};

export  function deleteUser(req, res) {
  const { id } = req.params;
  deleteUser_(id).then(msg => {
    res.status(200).json({status : true, msg : msg })
  }, error => {
    res.status(400).json({status : false, error : error.message })
  })
    
  
}
