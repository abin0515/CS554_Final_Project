import { posts, users, replies, points } from "../config/mongoCollections.js"
import user_seed from './user_seed.json' assert {type: "json"}
import post_seed from './post_seed.json' assert {type: "json"}
import reply_seed from './reply_seed.json' assert {type: "json"}
import point_seed from './point_seed.json' assert {type: "json"}


const userCol = await users()
const postCol = await posts()
const replyCol = await replies()
const pointCol = await points()


const formatted_user_seed = user_seed.map((u)=>{
    return {...u, updatedAt: new Date(u.updatedAt.$date)}
})

const formatted_post_seed = post_seed.map((p)=>{
    return {...p, create_time: new Date(p.create_time.$date), update_time: new Date(p.update_time.$date)}
})

const formatted_reply_seed = reply_seed.map((r)=>{
    return {...r, update_time: new Date(r.update_time.$date)}
})



await userCol.deleteMany({})
await postCol.deleteMany({})
await replyCol.deleteMany({})
await pointCol.deleteMany({})


await userCol.insertMany(formatted_user_seed)
await postCol.insertMany(formatted_post_seed)
await replyCol.insertMany(formatted_reply_seed)
await pointCol.insertMany(point_seed)

console.log("Database has been seeded")
return

