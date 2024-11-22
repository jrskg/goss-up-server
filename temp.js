import mongoose, {isValidObjectId} from "mongoose";

let userOneId = "670f9d8ce8fe4f0a398bf093";
let userTwoId = "66f9266fad32476d34c2ad5b";

// console.log({
//   userOneId,
//   userTwoId
// });

// if(userOneId > userTwoId){
//   [userOneId, userTwoId] = [userTwoId, userOneId];
// }

// console.log({
//   userOneId,
//   userTwoId
// });

// let ids = [userOneId, userTwoId];
// let validIds = ids.filter(id => isValidObjectId(id));
// console.log(validIds);

const data = [
  {
    _id: "ok1",
    name:"ok1 name"
  },
  {
    _id: "ok2",
    name:"ok2 name"
  },
  {
    _id: "ok3",
    name:"ok3 name"
  },
  {
    _id: "ok4",
    name:"ok4 name"
  },
  {
    _id: "ok5",
    name:"ok5 name"
  }
];


const map = new Map(data.map(item => [item._id, item]));

console.log(map);

