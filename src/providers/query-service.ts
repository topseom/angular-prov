import { Injectable,Inject } from "@angular/core";
import { Network } from '@ionic-native/network';
import { AngularFireDatabase,AngularFireList } from 'angularfire2/database';
import { AngularFirestore,AngularFirestoreCollection } from 'angularfire2/firestore';
import { AlertController,LoadingController} from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
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
  constructor(object){
    this.key = object.key;
    this.value = object.value;
  }
}


export class Options{
  table:string;
  ref:string;
  realtime:boolean;
  limit:number;
  page:number;
  loading:boolean;
  lastkey:string;
  method:string;
  api:string;
  data={};
  type:string;
  database:string;
  table_path:string;
  where:Array<{key:string,value:any}>;
  orderBy:string;
  loader={};
  constructor({table="",ref="",loading=false,database="",data={},loader={},lastkey="",method="",api="",realtime=false,limit=0,page=0,where=[{key:"",value:""}],orderBy="",type="",table_path=""}={}){
    this.table = table,this.ref = ref,this.loading=loading,this.realtime=realtime,this.page=page,this.where=where[0].key != ""?where:[],this.limit=limit,this.orderBy=orderBy,this.lastkey=lastkey,this.type=type,this.table_path = table_path,this.method=method,this.api=api,this.data=data;
  }
}


@Injectable()
export class QueryService {
  lists = "/lists";
  constructor(@Inject('config') private config:any,private network: Network,private http: HttpClient,public _siteStore:SiteStorage,public af: AngularFireDatabase,public afs:AngularFirestore, public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
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
    let database = args['database']?args['database']:this.getDatabase();
    args.options.ref = await this._siteStore.getSite();
    console.log("ARGS",args);
    if(!args.options.table){
      return Promise.reject({message:"not found table"});
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
      return Promise.reject({message:"not connect internet"});
    }else if(database == dbFirebase){
      return await this.firebase(args.options);
    }else if(database == dbFirestore){
      return await this.firestore(args.options);
    }else if(database == dbMysql){
      return await this.api(args.options);
    }
    return Promise.reject({message:"not found database"});
  }

  //Firebase
  async firebase(options:Options){
    options.table = options.table+'/'+options.table_path;
    console.log("TABLE",options.table);
    if(options.realtime){
      if(options.where.length && options.limit){
        let where = new Where(options.where[0]);
        return this.af.list('/'+options.ref+'/'+options.table,res=>res.orderByChild(where.key).equalTo(where.value).limitToFirst(options.limit));
      }else if(!options.where.length && options.limit){
        return this.af.list('/'+options.ref+'/'+options.table,res=>res.limitToFirst(options.limit));
      }else if(options.where.length && !options.limit){
        let where = new Where(options.where[0]);
        return this.af.list('/'+options.ref+'/'+options.table,res=>res.orderByChild(where.key).equalTo(where.value));
      }
      return this.af.list('/'+options.ref+'/'+options.table);
    }

    let loader = this.loadingCrtl.create();
    if(options.loading){
      loader.present();
    }
    let query = firebase.database().ref().child(options.ref).child(options.table);
    if(options.where.length){
      let where = new Where(options.where[0]);
      query = (query.orderByChild(where.key) as any);
      if(where.value){
        query = (query.equalTo(where.value) as any);
      }
    }
    if(options.limit){
      query = (query.limitToFirst(options.limit) as any);
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
        return data;
      }
    }
    return Promise.reject({message:"not found data"});
  }
  //Firestore
  async firestore(options:Options){
    options.table = options.table+'/'+options.table_path;
    if(options.realtime){
      if(options.where.length && options.limit){
        let where = new Where(options.where[0]);
        return this.afs.collection('/'+options.ref+'/'+options.table,res=>res.where(where.key,"==",where.value).limit(options.limit)).valueChanges();
      }else if(!options.where.length && options.limit){
        return this.afs.collection('/'+options.ref+'/'+options.table,res=>res.limit(options.limit)).valueChanges();
      }else if(options.where.length && !options.limit){
        let where = new Where(options.where[0]);
        return this.afs.collection('/'+options.ref+'/'+options.table,res=>res.where(where.key,"==",where.value)).valueChanges();
      }
      return this.af.list('/'+options.ref+'/'+options.table).valueChanges();
    }

    let loader = this.loadingCrtl.create();
    let query;
    if(options.loading){
      loader.present();
    }
    try{
      if(options.type == "object"){
        let tb = options.table.split("/");
        let index = tb[tb.length - 1];
        tb.pop();
        options.table = tb.join("/");
        query = this.afs.firestore.collection(options.ref+"/"+options.table+this.lists).doc(index);
      }
      query = this.afs.firestore.collection(options.ref+"/"+options.table+this.lists);
      if(options.where.length){
        options.where.forEach(where=>{
          where = new Where(where);
          query = query.where(where.key,"==",where.value);
        });
      }
      if(options.limit){
        query = query.limit(options.limit);
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
        await loader.dismiss();
        return data;
      }
      await loader.dismiss();
      return Promise.reject({message:"not found data"});
    }catch(e){
      await loader.dismiss();
      return Promise.reject({message:e});
    }
  }

  //Api
  async api(options:Options){
    let loader = this.loadingCrtl.create();
    if(options.loading){
      loader.present();
    }
    if(options.method == "get"){
      try{
        let data = await this.http.get(this.getBaseUrl()+jsonController+options.api+'/'+options.ref).toPromise();
        await loader.dismiss();
        return data;
      }catch(e){
        await loader.dismiss();
        return Promise.reject({message:e});
      }
    }else if(options.method == "post"){
      options.data['ref'] = options.ref;
      options.data['database'] = this.getDatabase();
      let body = JSON.stringify(options.data);
      try{
        let data = await this.http.post(this.getBaseUrl()+jsonController+options.api+'/'+options.ref,body).toPromise();
        await loader.dismiss();
        return data;
      }catch(e){
        await loader.dismiss();
        return Promise.reject({message:e});
      }
    }
    return Promise.reject({message:"not found method api to get data!"});
  }

}
