import {Injectable,Inject} from "@angular/core";
import { Network } from '@ionic-native/network';
import {AngularFireDatabase} from 'angularfire2/database';
import {AngularFirestore} from 'angularfire2/firestore';
import {AlertController,LoadingController} from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import {SiteService} from './site-service';
import 'rxjs/add/operator/take'
import * as tsfirebase from 'firebase/app';
const firebase = tsfirebase;
import * as tsmoment from 'moment';
const moment = tsmoment;
import * as _ from 'lodash';

import { Database,dbFirebase,dbMysql,table,textInternetConnectOffline, dbFirestore,baseUrl,jsonController } from './interface';
import { App } from '../../config/app';
let setting = App;

@Injectable()
export class QueryService {
  
  constructor(@Inject('config') private config:any,private network: Network,private http: HttpClient,public _site:SiteService,public af: AngularFireDatabase,public afs:AngularFirestore, public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
    setting[setting.app].database = config.database?config.database:setting[setting.app].database;
  }

  // Config
  getDatabase(){
    return setting[setting.app].database;
  }
  getBaseUrl(){
    return baseUrl;
  }

  async db(database : Database){
    let db = database;
    if(this.network.type && this.network.type == "none"){
      let alert = this.alertCtrl.create({
        title:"Attention",
        message:textInternetConnectOffline,
        buttons:[{
          text:"ok"
        }]
      });
      alert.present();
    }else if(db.firebase){
      return await this.firebase(db.firebase);
    }else if(db.json){
      return await this.json(db.json);
    }
    return 0;
  }

  // Firebase
  async firebase(option){
    if(this.getDatabase() == dbFirestore){
      return await this.firestore(option);
    }else{
      let site = await this._site.getSite();
      let withoutSite = option.withoutSite || false;
      if(site || withoutSite){
        let realtime = option.realtime || false; 
        let pagination = option.pagination || false;
        if(realtime){
          return await this.firebaseRealtime(option,site);
        }else if(pagination){
          return await this.firebasePagination(option,site);
        }
        return await this.firebaseOnce(option,site);
      }
      return 0;
    }
  }

  async firebaseRealtime(option,site){
    let loading = option.loading || false;
    let limit = option.limit || false;
    let orderBy = option.orderBy || false;
    let table = option.table || false;
    if(loading){
      //loader.present();
    }
    if(table){
      let query;
      if(orderBy && limit){
        query = this.af.list('/'+site+'/'+table,res=>res.orderByChild(orderBy.type).equalTo(orderBy.equal).limitToFirst(limit));
      }else if(!orderBy && limit){
        query = this.af.list('/'+site+'/'+table,res=>res.limitToFirst(limit));
      }else if(orderBy && !limit){
        query = this.af.list('/'+site+'/'+table,res=>res.orderByChild(orderBy.type).equalTo(orderBy.equal));
      }else{
        query = this.af.list('/'+site+'/'+table);
      }
      return query;
    }
    return 0;
  }

  async firebaseOnce(option,site){
    let loader = this.loadingCrtl.create();
    let type = option.type || false;

    // Options Table
    let loading = option.loading || false;
    if(loading){
      loader.present();
    }

    // Query
    if(option.table){
      let query = await this.firebaseOrderByAndLimit(option,site);
      if(query){
        let snap = await (query as any).once('value');
        await loader.dismiss();
        if(snap.val() != null){
          if(type == "object"){
            return snap.val();
          }else{
            let data = [];
            snap.forEach(item=>{
              let array = item.val();
              data.push(array);
            });
            return {data:data};
          }
        }
      }
    }
    return 0;
  }

  async firebaseOrderByAndLimit(option,site){
    let orderBy = option.orderBy || false;
    let limit = option.limit || false;
    let table = option.table || false;
    let withoutSite = option.withoutSite || false;
    let query;

    if(withoutSite){
      query = firebase.database().ref().child(table);
    }else{
      let ref = firebase.database().ref().child(site);
      query = ref.child(table);
    }

    if(orderBy){
      let c_orderBy = query.orderByChild(orderBy.type);
      if(orderBy.equal){
        c_orderBy = c_orderBy.equalTo(orderBy.equal);
      }
      query = (c_orderBy as any);
    }
    if(limit){
      let c_limit = query.limitToFirst(limit);
      query = (c_limit as any);
    }
    return query;
  }

  async firebasePagination(option,site){
    let loader = this.loadingCrtl.create();
     // Options Table
    let loading = option.loading || false;
    let table = option.table || false;
    let pagination = option.pagination;
    if(loading){
      loader.present();
    }

    // Query
    if(table){
      let ref = firebase.database().ref().child(site);
      let query;
      let page = false;
      if(pagination.lastkey){
         query = ref.child(table).orderByKey().startAt(pagination.lastkey).limitToFirst(pagination.limit+1);
         page = true;
      }else{
         query = ref.child(table).orderByKey().limitToFirst(pagination.limit);
      }
      let snap = await query.once('value');
      await loader.dismiss();
      if(snap.val() != null){
        let data = [];
        let lastKey;
        snap.forEach((item,index)=>{
          let array = item.val();
          array['key'] = item.key;
          data.push(array);
          lastKey = item.key;
        });
        if(page){
           data.shift();
        }
        return data;
        //return {data:data,lastkey:lastKey};
      }
    }
    return 0;
  }

  //Firestore
  async firestore(option){
    let site = await this._site.getSite();
    let withoutSite = option.withoutSite || false;
    if(site || withoutSite){
      let realtime = option.realtime || false; 
      let pagination = option.pagination || false;
      if(realtime){
        return await this.firestoreRealtime(option,site);
      }else{
        return await this.firestoreOnce(option,site);
      }
    }
    return 0;
  }

  async firestoreRealtime(option,site){
    let loading = option.loading || false;
    let limit = option.limit || false;
    let orderBy = option.orderBy || false;
    let table = option.table || false;
   
    if(table){
      let query;
      if(orderBy && limit){
        query = this.afs.collection('/'+site+'/'+table,res=>res.where(orderBy.type,"==",orderBy.equal).limit(limit)).valueChanges();
      }else if(!orderBy && limit){
        query = this.afs.collection('/'+site+'/'+table,res=>res.limit(limit)).valueChanges();
      }else if(orderBy && !limit){
        query = this.afs.collection('/'+site+'/'+table,res=>res.where(orderBy.type,"==",orderBy.equal)).valueChanges();
      }else{
        query = this.af.list('/'+site+'/'+table).valueChanges();
      }
      return query;
    }
    return 0;
  }

  async firestoreOnce(option,site){
    let loader = this.loadingCrtl.create();
    let type = option.type || false;
    // Options Table
    let loading = option.loading || false;
    if(loading){
      loader.present();
    }
    // Query
    if(option.table){
      let data = await this.firestoreOrderByAndLimit(option,site);
      await loader.dismiss();
      if(data){
        let query = await (data as any).get();
        if(query){
          if(type == "object"){
            return query.data();
          }else{
            let data = [];
            query.forEach(item=>{
              let array = item.data();
              data.push(array);
            });
            return data;
          }
          
        }
      }
      return 0;
    }
    await loader.dismiss();
    return 0;
  }

  async firestoreOrderByAndLimit(option,site){
    let orderBy = option.orderBy || false;
    let limit = option.limit || false;
    let table = option.table || false;
    let type = option.type || false;
    let withoutSite = option.withoutSite || false;
    let query;

    if(withoutSite){
      if(type == "object"){
        query = this.afs.firestore.collection(table+"/lists");
      }else{
        query = this.afs.firestore.collection(table+"/lists");
      }
    }else{
      if(type == "object"){
        let tb = table.split("/");
        let index = tb[tb.length - 1];
        tb.pop();
        table = tb.join("/");
        query = this.afs.firestore.collection(site+"/"+table+"/lists").doc(index);
      }else{
        query = this.afs.firestore.collection(site+"/"+table+"/lists");
      }
    }
    if(orderBy){ 
      let c_orderBy = query;
      if(orderBy.equal){
        c_orderBy = c_orderBy.where(orderBy.type,"==",orderBy.equal);
      }
      query = (c_orderBy as any);
    }
    if(limit){
      let c_limit = query.limit(limit);
      query = (c_limit as any);
    }
    return query;
  }

  async getConfigApp(){
    return await this._site.getConfigApp();
  }

  async build_tree(nodes){
    let map = {}, node, roots = [];
    for (var i = 0; i < nodes.length; i += 1) {
               node = nodes[i];
               node['children'] = [];
               map[node.id] = i;
               if (node.parent !== 0) {
                 if(nodes[map[node.parent]]){
                   nodes[map[node.parent]]['children'].push(node);
                 }
               }else{
                 roots.push(node);
               }
    }
    return roots;
  }

  unflatten(arr) {
    var tree = [],
        mappedArr = {},
        arrElem,
        mappedElem;

    for(var i = 0, len = arr.length; i < len; i++) {
      arrElem = arr[i];
      mappedArr[arrElem.id] = arrElem;
      mappedArr[arrElem.id]['children'] = [];
    }
    for (var id in mappedArr) {
      if (mappedArr.hasOwnProperty(id)) {
        mappedElem = mappedArr[id];
       
        if (mappedElem.parent && mappedElem.parent != "0") {
          mappedArr[mappedElem['parent']]['children'].push(mappedElem);
        }
        else {
          tree.push(mappedElem);
        }
      }
    }
    return tree;
  }

  async build_categories(table:string,load=false){
    let loader = this.loadingCrtl.create();
    if(load){
      loader.present();
    }
    let query = {
      firebase:{
        table:table,
        orderBy:{
          type:"parent"
        }
      }
    }
    let callback = await this.db(query);
    if(callback){
      let builded = await this.build_tree(callback);
      await loader.dismiss();
      return builded;
    }
    await loader.dismiss();
    return 0;
  }

  async pagination(array:Array<any>,data_all:Array<any>,current:number,limit:number){
    if(current == 1){
      data_all = data_all.slice(0,limit);
    }else{
      let begin = current * limit;
      let end = (current + 1) * limit;
      data_all = data_all.slice(begin-1,end);
    }
    data_all.forEach(item=>{
      array.push(item);
    });
    return array;
  }

  //Json
  async json(option){
    let site = await this._site.getSite();
    if(option.table && option.method){
      let method = option.method;
      if(method == "get"){
        return await this.json_get(option,site);
      }else if(method == "post"){
        return await this.json_post(option,site);
      }
    }
    return 0;
  }
  
  async json_get(option,site):Promise<any>{
    let loader = this.loadingCrtl.create();
    let table = option.table;
    let loading = option.loading || false;
    if(loading){
        loader.present();
    }
    let callback = await this.http.get(this.getBaseUrl()+jsonController+table+'/'+site).toPromise();
    await loader.dismiss();
    return callback;
  }

  async json_post(option,site):Promise<any>{
    let loader = this.loadingCrtl.create();
    let table = option.table;
    let loading = option.loading || false;
    let data = option.data || false;
    if(table && data){
      data['site_reft'] = site;
      if(loading){
        loader.present();
      }
      let body = JSON.stringify(data);
      try{
        let callback = await this.http.post(this.getBaseUrl()+jsonController+table+'/'+site,body).toPromise();
        await loader.dismiss();
        return callback;
      }catch(e){
        await loader.dismiss();
        return 0;
      }
    }
    return 0;
  }


  //banner
  async banner_home({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_banner_home",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return callback;
      }
      return 0;
    }else{
      let query = {
        firebase:{
          table:table.banner_single+"/mester-banner",
          loading:load,
          type:"object"
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  //blog
  async blog_categories({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_blog_categories",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return callback;
      }
      return 0;
    }else{
      let query = {
        firebase:{
          table:table.blog_category,
          loading:load
        }
      }
      let callback = await this.db(query);
      return (callback || null);
    }
  }

  async blog_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_blog_single_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return callback;
      }
      return 0;

    }else{
      let query = {
        firebase:{
          table:table.blog_list+"/"+id,
          loading:load,
          type:"object"
        }
      }
      let callback = await this.db(query);
      return (callback || null);
    }
  }

  async blog_type({load=false,type}){
    if(this.getDatabase() == dbMysql){
      switch(type){
        case "featured":
          type = "featured_blog";
          break;
      }
      let query = {
        json:{
          table:"json_blog_type/"+type,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return callback;
      }
      return 0;

    }else{
      let query = {
        firebase:{
          table:table.blog_list,
          orderBy:{
            type:type,
            equal:"1"
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  async blog_listAll({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_blog_list",
          method:"get",
          loading:load,
        }
      }
      let callback = this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          loading:load,
          table:table.blog_list
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  async blog_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_blog_list_categories/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          loading:load,
          table:table.blog_list,
          orderBy:{
            type:"category",
            equal:id
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  
  //product
  async product_categories_list({product=[],cate_id=[]}){
    if(cate_id.length){
      let filter = []
      cate_id.forEach(cate=>{
        product.forEach(pro=>{
          if(pro.category && pro.category['category_'+cate.id]){
            filter.push(pro);
          }
        });
      });
      if(filter.length){
         filter = _.uniqBy(filter,"id");
      }else{
         filter = product;
      }
      return(filter);
   }else{
     return(product);
   }
  }

  async product_filter_local({product,option,cate_id=""}){
    if(cate_id){
      if(option){
        let filter = [];
        option.forEach(op=>{
          let id = op.split(":")[1];
          product.forEach(data=>{
            if(data.category && data.category['category_'+cate_id] && data.filter && data.filter['filter_'+id]){
              filter.push(data);
            }
          });
        });
        if(filter.length){
          filter = _.uniqBy(filter,"id");
        }else{
          filter = product;
        }
        return(filter);
      }else{
        return(product);
      }
    }else{
      if(option){
        let filter = [];
        option.forEach(op=>{
          let id = op.split(":")[1];
          product.forEach(data=>{
            if(data.filter && data.filter['filter_'+id]){
              filter.push(data);
            }
          });
        });
        if(filter.length){
          filter = _.uniqBy(filter,"id");
        }else{
          filter = product;
        }
        return(filter);
      }else{
        return(product);
      }
    }
  }

  async product_filterPhp({load = false,cate_id="",option}){
    let query = {
      json:{
        table:"json_product_filter",
        method:"post",
        data:{
            option:option,
            cate_id:cate_id
        },
        loading:load,
      }
    }
    let callback = this.db(query);
    if(callback){
        return(callback);
    }else{
        return(0);
    }
  }

  async product_single({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_product_single",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
      
    }else{
      let query = {
        firebase:{
          table:table.product_single,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  async product_barcode({load=false}){
    let query = {
      firebase:{
        table:table.product_barcode,
        loading:load
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  async product_filter({load=false}){
    let query = {
      firebase:{
        table:table.product_filter,
        loading:load,
        type:"object",
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  async product_categoryAll({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_product_category",
          method:"get",
          loading:load,
        }
      }
      let callback = this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let categories = {
        firebase:{
          table:table.product_category,
          loading:load
        }
      }
      let callback = await this.db(categories);
      return(callback || null);
    }
  }

  async product_category({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_product_category",
          method:"get",
          loading:load,
        }
      }
      let callback = this.db(query);
      if(callback){
        return(callback);
      }
      return 0;
    }else{
      let categories = {
        firebase:{
          table:table.product_category,
          loading:load
        }
      }
      let callback = await this.db(categories);
      if(callback){
          callback = this.unflatten(callback);
      }
      return(callback || null);
    }
    
  }
  async product_category_filter_id({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_category_filter_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let categories = {
        firebase:{
          table:table.product_category,
          loading:load,
          orderBy:{
                  type:"id",
                  equal:id
          }
        }
      }
      let callback = await this.db(categories);
      return(callback[0] || null);
    }
  }

  async product_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_product_single_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
        //console.log("DETAIL",callback);
      }else{
        return(0);
      }

    }else{
      let query = {
        firebase:{
          table:table.product_single+"/"+id,
          type:"object",
          loading:load,
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  async product_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_product_category_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.product_list,
          loading:load,
          orderBy:{
                  type:"category/category_"+id,
                  equal:true
                 }
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  async product_store({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_store",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.product_store,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  async product_listAll({load=false}){
    //let local = "product_listAll";
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_product_list",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return callback;
      }else{
        return 0;
      }
    }else{
      let query = {
        firebase:{
          table:table.product_list,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  async product_listPagination({load=false,lastkey="",limit=0}){
    let query = {
      firebase:{
        table:table.product_list,
        loading:load,
        pagination:{
          limit:limit,
          lastkey:lastkey
        }
      }
    }
    let callback = await this.db(query);
    return (callback || null);
  }

  async product_coupon({load=false,title}){
    let query = {
      firebase:{
        table:table.product_promotion,
        loading:load,
        orderBy:{
          type:"conditions/coupon_title",
          equal:title
        }
      }
    }
    let callback = await this.db(query);
    return(callback?callback[0]:null);
  }

  async product_couponUsed({load=false,id}){
    let query = {
      firebase:{
          table:table.order_single,
          orderBy:{
            type:"promotion_id/promotion_"+id,
            equal:true
          }
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  async product_couponTime({load=false,userId,id}){
    let query = {
      firebase:{
             table:table.order_single,
             orderBy:{
               type:"created_by_promo/"+userId+"_promotion_"+id,
               equal:true
             }
      }
    }
    let callback = await this.db(query);
    return(callback || []);
  }

  async product_type({type,load=false,limit = 0}){
    if(this.getDatabase() == dbMysql){
      switch(type){
        case "new":
          type = "show_new"
          break;
        case "sale":
          type = "show_sale"
          break;
      }
      let query = {
        json:{
          table:"json_product_type/"+type,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }

    }else{
      let query = {
        firebase:{
            table:table.product_list,
            limit:limit,
            loading:load,
            orderBy:{
              type:type,
              equal:"1"
            }
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }


  //listing
  async listing_category({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_listing_category",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
          return(callback);
      }else{
          return(0);
      }

    }else{
      let queryCate = {
        firebase:{
          table:table.listing_category,
          loading:load
        }
      }
      let callback = await this.db(queryCate);
      return(callback || null);
    }
  }
  async listing_home({load=false}){
    let query = {
      firebase:{
        table:"listing_home",
        loading:load
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  async listing_featured({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_listing_featured",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      } 
    }else{
      let query = {
        firebase:{
          table:table.listing_single,
          loading:load,
          orderBy:{
            type:"featured",
            equal:"1"
          }
        }
      }
      let callback = await this.db(query);
      return (callback || null);
    }
  }
  async listing_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_listing_list_category_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }

    }else{
      let query = {
        firebase:{
          table:table.listing_single,
          loading:load,
          orderBy:{
            type:"category",
            equal:id
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null);

    }
  }
  async listing_listAll({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_listing_single",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
       
    }else{
      let query = {
            firebase:{
              table:table.listing_single,
              loading:load
            }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  //navigation
  async navigations({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_navigation",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
      
    }else{
      let query = {
          firebase:{
            table:table.navigation+"/mobile/navigations",
            loading:load,
            type:"object"
          }
      }
      let callback = await this.db(query);
      return(callback);
    }
  }

  //gallery
  async gallery_category({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_gallery_category",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        //console.log("Gallery Cate:",callback);
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.gallery_category,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);  
    }
  }
  async gallery_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_gallery_single_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
      
      
    }else{
      let query = {
        firebase:{
          table:table.gallery_single+"/"+id,
          loading:load,
          type:"object"
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  async gallery_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_gallery_category_list_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        //console.log("Gallery List:",callback);
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.gallery_single,
          loading:load,
          orderBy:{
            type:"category",
            equal:id
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null); 
    }
  }
  async gallery_single({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_gallery_single",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.gallery_single,
          loading:load,
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  //page
  async page_detail({load=false,slug,lang="en"}){
      if(this.getDatabase() == dbMysql){
        let query = {
          json:{
            table:"json_page_single_id/"+slug,
            method:"get",
            loading:load,
          }
        }
        let callback = await this.db(query);
        if(callback){
          return(callback);
        }else{
          return(0);
        }
      }else{
        let query = {
          firebase:{
            table:table.page_single+"/"+slug+"_"+lang,
            loading:load,
            type:"object"
          }
        }
        let callback = await this.db(query);
        return(callback || null);
      }
  }
  async page_single({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_page_single",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.page_single,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  //portfolio
  async portfolio_categories({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_portfolio_category",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.portfolio_category,
          loading:load
        }

      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  
  async portfolio_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_portfolio_single_id/"+id,
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        //console.log("Portfolio List: ",callback);
        return(callback);
      }else{
        return(0);
      }
     
    }else{
      let query = {
        firebase:{
          table:table.portfolio_single,
          loading:load,
          orderBy:{
            type:"category",
            equal:id
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  async portfolio_single({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_portfolio_single",
          method:"get",
          loading:load
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.portfolio_single,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  //order
  async order_single({load=false}){
    let query = {
      firebase:{
        table:table.order_single,
        loading:load
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  async order_user({load=false}){
    let user = await this._site.getUser();
    if(user){
      let query = {
        firebase:{
          table:table.order_single,
          loading:load,
          orderBy:{
              type:"created_id",
              equal: (user as any).id
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }else{
      return(0);
    }
  }
  async order_today({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_order_today",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }
    else{
      let query = {
        firebase:{
          table:table.order_single,
          loading:load,
          orderBy:{
              type:"created",
              //equal: "2017-03-24"
              equal: moment().format('YYYY-MM-DD HH:mm:ss')
          }
        }
      }
      let callback = await this.db(query);
      return(callback || null); 
    }
    
  }
  async order_address({load=false,id}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_address_user/"+id,
          method:"get",
          loading:load
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.order_address,
          loading:load,
          orderBy:{
              type:"created_by",
              equal:id
          }
        }
      }
      let callback = await this.db(query);
      return (callback || null);
    }
  }
  async order_gateway({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_gateway",
          method:"get",
          loading:load
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
      
    }else{
      let query = {
        firebase:{
          table:table.order_gateway,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  async order_shipping({load=false}){
    let query = {
      firebase:{
        table:table.order_shipping,
        loading:load
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  //user
  async users_single({load=false}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_users",
          method:"get",
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.users_single,
          loading:load
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }

  //stream
  async stream_signup({load=false}){
    let query = {
      firebase:{
        table:table.stream_signup,
        loading:load
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  //images
  async images({load=false}){
    let query = {
      json:{
        table:"json_images",
        method:"get",
        loading:load,
      }
    }
    let callback = await this.db(query);
    if(callback){
      return(callback);
    }else{
      return(0);
    }  
  }

  //form
  async form_config({load=false}){
    let query = {
      firebase:{
        table:table.form_config,
        loading:load,
        type:"object"
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  //authen
  async auth_site({site,load=false}){
    let query = {
      firebase:{
        table:table.site_list+site,
        withoutSite:true,
        loading:load,
        type:"object"
      }
    }
    let callback = await this.db(query);
    return(callback || null);
  }

  async auth_user({username,password,load=false,hash=""}){
    if(this.getDatabase() == dbMysql){
      let query = {
        json:{
          table:"json_login",
          method:"post",
          data:{
              username:username,
              password:password
          },
          loading:load,
        }
      }
      let callback = await this.db(query);
      if(callback){
        return(callback);
      }else{
        return(0);
      }
    }else{
      let query = {
        firebase:{
          table:table.users_single+'/'+hash,
          loading:load,
          type:"object"
        }
      }
      let callback = await this.db(query);
      return(callback || null);
    }
  }
  
}
