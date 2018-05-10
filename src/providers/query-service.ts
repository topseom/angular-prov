import { Injectable,Inject } from "@angular/core";
import { Network } from '@ionic-native/network';
import { AngularFireDatabase,AngularFireList } from 'angularfire2/database';
import { AngularFirestore,AngularFirestoreCollection } from 'angularfire2/firestore';
import { AlertController,LoadingController} from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { SiteStorage } from './site-storage';
import 'rxjs/add/operator/take'
import * as tsfirebase from 'firebase/app';
const firebase = tsfirebase;
import * as tsmoment from 'moment';
const moment = tsmoment;
import * as _ from 'lodash';

import { Observable } from "rxjs/Rx";

import { Database,dbFirebase,dbMysql,textInternetConnectOffline, dbFirestore,baseUrl,jsonController } from './interface';
import { App } from '../../config/app';
let setting = App;

export class Query{
  options:Options;
  constructor(table,object:Options){
      this.options = {...object,table};
      console.log("Query",table,this.options);
  }
}

export class Where{
  key:string;
  value:any;
  constructor(object,db=""){
    if(db == dbFirestore){
      this.key = object.key.replace("/",".");
    }else{
      this.key = object.key;
    }
    this.value = object.value;
  }
}


export class Options{
  table:string;
  ref:string;
  realtime:boolean;
  lang:boolean;
  lang_code:string;
  limit:number;
  page:number;
  loading:boolean;
  lastkey:string;
  method:string;
  api:string;
  api_type:string;
  api_version:string;
  data={};
  type:string;
  database:string;
  table_path:string;
  where:Array<{key:string,value:any}>;
  orderBy:string;
  other_data={};
  other_table:string;
  upload:boolean;
  constructor({table="",ref="",loading=false,upload=false,lang_code="",lang=false,database="",other_data={},other_table="",data={},lastkey="",method="",api="",api_type="",api_version="",realtime=false,limit=0,page=0,where=[{key:"",value:""}],orderBy="",type="",table_path=""}={}){
    this.table = table,this.ref = ref,this.loading=loading,this.realtime=realtime,this.page=page,this.where=where[0].key != ""?where:[],this.limit=limit,this.orderBy=orderBy,this.lastkey=lastkey,this.type=type,this.table_path = table_path,this.method=method,this.api=api,this.data=data,this.api_type=api_type,this.api_version=api_version;
    this.lang = lang,this.lang_code=lang_code,this.database = database;this.other_data = other_data;this.other_table = other_table;
    this.upload = upload;
  }
}


@Injectable()
export class QueryService {
  lists = "/lists";
  api_version = "v1/";
  api_type = "json/";
  lastKey = [];

  constructor(@Inject('config') private config:any,public translate: TranslateService,private network: Network,private http: HttpClient,public _siteStore:SiteStorage,public af: AngularFireDatabase,public afs:AngularFirestore, public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
    setting[setting.app].database = config.database?config.database:setting[setting.app].database;
  }

  // Config
  getDatabase(){
    return setting[setting.app].database;
  }
  getBaseUrl(){
    return baseUrl;
  }

  async query(table:string,options:Options){
    return await this.db(new Query(table,options));
  }

  async db(args : Query){
    let database = args.options.database?args.options.database:this.getDatabase();
    args.options.ref = await this._siteStore.getSite();
    args.options.table = args.options.table_path.charAt(0) ? args.options.table+'/'+args.options.table_path : args.options.table ;
    if(args.options.lang){
      args.options.lang_code = this.translate.currentLang || "en";
    }
    console.log("ARGS",args);
    if(!args.options.table){
      return Promise.reject({message:"not found table",status:404});
    }
    if(this.network.type && this.network.type == "none"){
      let alert = this.alertCtrl.create({
        title:"Attention",
        message:textInternetConnectOffline,
        buttons:[{
          text:"ok"
        }]
      });
      alert.present();
      return Promise.reject({message:"not connect internet",status:400});
    }else if(database == dbFirebase){
      return await this.firebase(args.options);
    }else if(database == dbFirestore){
      return await this.firestore(args.options);
    }else if(database == dbMysql){
      return await this.api(args.options);
    }
    return Promise.reject({message:"not found database",status:404});
  }

  //Firebase
  async firebase(options:Options){
    options.table = options.ref+"/"+options.table;
    if(options.lang){
      options.table = options.table+"/"+options.lang_code;
    }
    if(options.realtime){
      if(options.where.length && options.limit){
        let where = new Where(options.where[0]);
        return this.af.list(options.table,res=>res.orderByChild(where.key).equalTo(where.value).limitToFirst(options.limit)).snapshotChanges().map(items=>{
          return items.map(item=>{
            return {
              ...item.payload.val(),
              id:item.payload.key
            }
          });
        });
      }else if(!options.where.length && options.limit){
        return this.af.list(options.table,res=>res.limitToFirst(options.limit)).snapshotChanges().map(items=>{
          return items.map(item=>{
            return {
              ...item.payload.val(),
              id:item.payload.key
            }
          });
        });
      }else if(options.where.length && !options.limit){
        
        let where = new Where(options.where[0]);
        return this.af.list(options.table,res=>res.orderByChild(where.key).equalTo(where.value)).snapshotChanges().map(items=>{
          return items.map(item=>{
            return {
              ...item.payload.val(),
              id:item.payload.key
            }
          });
        });
      }
      return this.af.list(options.table).snapshotChanges().map(items=>{
        return items.map(item=>{
          return {
            ...item.payload.val(),
            id:item.payload.key
          }
        });
      });
    }
    //console.log("5");

    let loader = this.loadingCrtl.create();
    if(options.loading){
      loader.present();
    }
    let query = firebase.database().ref().child(options.table);
    if(options.where.length){
      let where = new Where(options.where[0]);
      query = (query.orderByChild(where.key) as any);
      if(where.value){
        query = (query.equalTo(where.value) as any);
      }
    }
    if(options.limit){
      query = (query.limitToFirst(options.page?options.limit+1:options.limit) as any);
    }
    if(options.page && options.page > 1){
      query = (query.orderByKey() as any);
      query = (query.startAt(this.lastKey[options.table]) as any);
    }

    let snap = await query.once('value');
    await loader.dismiss();
    if(snap.val() != null){
      if(options.type == "object"){
        return snap.val();
      }else{
        let data = [];
        snap.forEach(item=>{
          let array = item.val();
          data.push(array);
        });
        //options.table
        if(options.page && data.length){
          this.lastKey[options.table] = data[data.length - 1].id;
          data.pop();
        }
        return data;
      }
    }
    return Promise.reject({message:"not found data",status:404});
  }
  //Firestore
  async firestore(options:Options){
    options.table = options.ref+"/"+options.table+this.lists;
    if(options.lang){
      options.table = options.table+"_"+options.lang_code;
    }
    if(options.realtime){
      if(options.where.length && options.limit){
        let where = new Where(options.where[0],dbFirestore);
        return this.afs.collection('/'+options.table,res=>res.where(where.key,"==",where.value).limit(options.limit)).snapshotChanges().map(items=>{
          return items.map(item=>{
            return{
              ...item.payload.doc.data(),
              id:item.payload.doc.id,
            }
          })
        });
      }else if(!options.where.length && options.limit){
        return this.afs.collection('/'+options.table,res=>res.limit(options.limit)).snapshotChanges().map(items=>{
          return items.map(item=>{
            return{
              ...item.payload.doc.data(),
              id:item.payload.doc.id,
            }
          })
        });
      }else if(options.where.length && !options.limit){
        let where = new Where(options.where[0],dbFirestore);
        return this.afs.collection('/'+options.table,res=>res.where(where.key,"==",where.value)).snapshotChanges().map(items=>{
          return items.map(item=>{
            return{
              ...item.payload.doc.data(),
              id:item.payload.doc.id,
            }
          })
        });
      }
      return this.afs.collection(options.table).snapshotChanges().map(items=>{
        return items.map(item=>{
          return{
            ...item.payload.doc.data(),
            id:item.payload.doc.id,
          }
        })
      });
    }
    

    let loader = this.loadingCrtl.create();
    let query;
    if(options.loading){
      loader.present();
    }
    try{
      if(options.type == "object"){
        let tb = options.table.split("/");
        let index = tb[tb.length - 2];
        tb.splice(tb.length - 2,1);
        options.table = tb.join("/");
        query = this.afs.firestore.collection(options.table).doc(index);
      }else{
        query = this.afs.firestore.collection(options.table);
      }
      if(options.where.length){
        options.where.forEach(where=>{
          where = new Where(where,dbFirestore);
          query = query.where(where.key,"==",where.value);
        });
      }
      if(options.limit){
        query = query.limit(options.limit);
      }
      if(options.page && options.page > 1){
        if(options.where){
          let where = new Where(options.where[0],dbFirestore);
          query = query.orderBy(where.key);
        }else{
          query = query.orderBy("id")
        }
        query = query.startAfter(this.lastKey[options.table]);
      }

      query = await query.get();
      
      if(query){
        if(options.type == "object"){
          await loader.dismiss();
          return query.data();
        }
        let data = [];
        query.forEach(item=>{
          let array = item.data();
          data.push(array);
        });
        if(options.page && data.length){
          this.lastKey[options.table] =  data[data.length - 1].id;
        }
        await loader.dismiss();
        return data;
      }
      await loader.dismiss();
      return Promise.reject({message:"not found data",status:404});
    }catch(e){
      await loader.dismiss();
      return Promise.reject({message:e,status:400});
    }
  }

  //Api
  async api(options:Options){
    options.api_type = options.api_type ? options.api_type : this.api_type;
    options.api_version = options.api_version ? options.api_version : this.api_version;
    let loader = this.loadingCrtl.create();
    if(options.loading){
      loader.present();
    }
    if(options.method == "get"){
      try{
        let data = await this.http.get(this.getBaseUrl()+jsonController+options.api_version+options.api_type+options.api+'/'+options.ref).toPromise();
        await loader.dismiss();
        return data;
      }catch(e){
        await loader.dismiss();
        return Promise.reject({message:e,status:400});
      }
    }else if(options.method == "post" || options.method == "push"){
      let data = {};
      if(options.other_table){
        data['other_data'] = options.other_data;
        data['other_table'] = options.other_table;
      }
      let body;
      if(options.upload){
        body = new FormData();
        body.append("lang_code",options.lang_code);
        body.append('ref',options.ref);
        body.append('database',this.getDatabase());
        //console.log("IMAGE",options.data['image']);
        if(options.data['image'].name){
          body.append("image", options.data['image'], options.data['image'].name);
        }
        body.append("data",JSON.stringify(options.data));
      }else{
        data['lang_code'] = options.lang_code;
        data['ref'] = options.ref;
        data['database'] = this.getDatabase();
        data['data'] = options.data;
        body = JSON.stringify(data);
      }
      console.log("DATA BEFORE SEND",body);
      try{
        let data = await this.http.post(this.getBaseUrl()+jsonController+options.api_version+options.api_type+options.api+'/'+options.ref,body).toPromise();
        await loader.dismiss();
        return data;
      }catch(e){
        await loader.dismiss();
        return Promise.reject({message:e,status:400});
      }
    }
    return Promise.reject({message:"not found method api json to get data!",status:404});
  }

}
