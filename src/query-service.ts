import {Injectable} from "@angular/core";
import { Network } from '@ionic-native/network';
import {AngularFireDatabase} from 'angularfire2/database';
import {AlertController,LoadingController} from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import {SiteService} from './site-service';
import 'rxjs/add/operator/take'
import * as tsfirebase from 'firebase/app';
const firebase = tsfirebase;
import * as tsmoment from 'moment';
const moment = tsmoment;
import * as _ from 'lodash';

import { Database,dbFirebase,dbMysql,table,textInternetConnectOffline } from './interface';
import { App } from '../config/app';
let setting = App;

@Injectable()
export class QueryService {
  
  baseUrl = "https://seven.co.th/";
  
  jsonController = "domains/application/";

  

  constructor(private network: Network,private http: HttpClient,public _site:SiteService,public af: AngularFireDatabase, public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
    //console.log("Db",this.getDatabase());
    //console.log("BaseUrl",this.getBaseUrl());
  }

  // Config
  getDatabase(){
    return setting[setting.app].database;
  }
  getBaseUrl(){
    //return setting[setting.app].baseUrl;
    //console.log("BASE URL",this.baseUrl);
    return this.baseUrl;
  }

  db(database : Database){
    return new Promise<any>((resolve, reject) => {
      let db = database;
      if(this.network.type && this.network.type == "none"){
        resolve(0);
        let alert = this.alertCtrl.create({
                title:"Attention",
                message:textInternetConnectOffline,
                buttons:[{
                  text:"ok"
                }]
        });
        alert.present();
      }
      else if(db.firebase){
        resolve(this.firebase(db.firebase));
      }else if(db.json){
        resolve(this.json(db.json));
      }else{
        resolve(0);
      }
    });
  }
  // Firebase
  firebase(option){
    return new Promise<any>((resolve, reject) => {
        this._site.getSite().then(site=>{
          let withoutSite = option.withoutSite || false;
          if(site || withoutSite){
            let realtime = option.realtime || false; 
            let pagination = option.pagination || false;
            if(realtime){
              resolve(this.firebaseRealtime(option,site));
            }else if(pagination){
              resolve(this.firebasePagination(option,site));
            }else{
              resolve(this.firebaseOnce(option,site));
            }
          }
        });
    });
  }
  firebaseRealtime(option,site){
    //let loader = this.loadingCrtl.create();
    return new Promise<any>((resolve, reject) => {

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
          resolve(query);
        }else{
          resolve(0);
        }
        
        /*this.firebaseOrderByAndLimit(option,site).then(query=>{
          resolve(query);
        });*/
    });
  }
  firebaseOnce(option,site){
    let loader = this.loadingCrtl.create();
    return new Promise<any>((resolve, reject) => {
        let type = option.type || false;

        // Options Table
        let loading = option.loading || false;
        if(loading){
          loader.present();
        }

        // Query
        if(option.table){
          this.firebaseOrderByAndLimit(option,site).then(query=>{
            if(query){
              (query as any).once('value').then(snap=>{
                  loader.dismiss().then(callback=>{
                    if(snap.val() != null){
                      if(type == "object"){
                        resolve(snap.val());
                      }else{
                        let data = [];
                        snap.forEach(item=>{
                          let array = item.val();
                          //array['key'] = item.key;
                          data.push(array);
                        });
                        resolve({data:data});
                      }
                     
                    }else{
                      resolve(0);
                    }
                    })  
              });
            }else{
              resolve(0);
            }
          })
        }else{
          resolve(0);
        }
    });
  }
  firebaseOrderByAndLimit(option,site){
    return new Promise<any>((resolve, reject) => {
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
      resolve(query);
    });
  }
  firebasePagination(option,site){
    let loader = this.loadingCrtl.create();
    return new Promise<any>((resolve, reject) => {
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
           query.once('value').then(snap=>{
              loader.dismiss().then(status=>{
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
                  resolve({data:data,lastkey:lastKey});
                }else{
                  resolve(0);
                }
              });
           });
       
        }else{
          resolve(0);
        }
    });
  }
  getConfigApp(){
    return new Promise<any>((resolve,reject) => {
            this._site.getConfigApp().then(callback=>{
              resolve(callback);
            })
    });
  }
  build_tree(nodes){
    return new Promise((resolve,reject)=>{
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
      resolve(roots);
    });
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
  build_categories(table:string,load=false){
    let loader = this.loadingCrtl.create();
    if(load){
      loader.present();
    }
    return new Promise((resolve,reject)=>{
      let query = {
        firebase:{
          table:table,
          orderBy:{
            type:"parent"
          }
        }
      }
      this.db(query).then(callback=>{
        if(callback){
          this.build_tree(callback.data).then(builded=>{
            loader.dismiss().then(callback=>{
              resolve(builded);
            });
          });
        }else{
          loader.dismiss().then(callback=>{
            resolve(0);
          });
        }
     
      })
      
    });
  }
  pagination(array:Array<any>,data_all:Array<any>,current:number,limit:number){
    return new Promise<Array <any>>((resolve,reject)=>{
     
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
        resolve(array);
      
    });
  }


  //Json
  json(option){
    return new Promise<any>((resolve, reject) => {
      this._site.getSite().then(site=>{
        //console.log("SITE",site);
        if(option.table && option.method){
          let method = option.method;
          if(method == "get"){
            resolve(this.json_get(option,site));
          }else if(method == "post"){
            resolve(this.json_post(option,site));
          }else{
            resolve(0);
          } 
        }else{
          resolve(0);
        }
      });
    });
  }

  json_get(option,site){
    let loader = this.loadingCrtl.create();
    return new Promise<any>((resolve, reject) => {
      let table = option.table;
      let loading = option.loading || false;
      if(loading){
          loader.present();
      }
      this.http.get(this.getBaseUrl()+this.jsonController+table+'/'+site)
      .subscribe(data => {
        loader.dismiss().then(callback=>{
          resolve(data);
        });
      },err=>{
        loader.dismiss().then(callback=>{
          resolve(0);
        });
      });
    });
  }

  json_post(option,site){
    let loader = this.loadingCrtl.create();
    return new Promise<any>((resolve, reject) => {
      let table = option.table;
      let loading = option.loading || false;
      let data = option.data || false;
      if(table && data){
        data['site_reft'] = site;
        //console.log("DATA BEFORE",data);
        if(loading){
          loader.present();
        }
        let body = JSON.stringify(data);
        this.http.post(this.getBaseUrl()+this.jsonController+table+'/'+site,body)
        .subscribe(data => {
          loader.dismiss().then(callback=>{
            resolve(data);
          });
        },err=>{
          loader.dismiss().then(callback=>{
            resolve(0);
          });
        });
      }else{
        resolve(0);
      }
    });
  }

  //banner
  banner_home({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject)=>{
        let query = {
          json:{
            table:"json_banner_home",
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.banner_single+"/mester-banner",
            loading:load,
            type:"object"
          }
        }
        this.db(query).then(callback=>{
          resolve(callback || null);
        });
      });
    }
    
  }

  //blog
  blog_categories({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_blog_categories",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.blog_category,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }

  blog_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_blog_single_id/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject) =>{
        let query = {
          firebase:{
            table:table.blog_list+"/"+id,
            loading:load,
            type:"object"
          }
        }
        this.db(query).then(callback=>{
           resolve(callback || null);
        });
      });
    }
  }
  blog_type({load=false,type}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
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
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.blog_list,
            orderBy:{
              type:type,
              equal:"1"
            }
          }
        }
        this.db(query).then(callback=>{
           resolve(callback.data || null);
        });
      });
    }
  }
  blog_listAll({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_blog_list",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            loading:load,
            table:table.blog_list
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        })
      });
    }
  }
  blog_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_blog_list_categories/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("List",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        })
      });
    }
  }
  
  //product
  product_categories_list({product=[],cate_id=[]}){
    return new Promise<any>((resolve,reject) => {
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
         resolve(filter);
      }else{
        resolve(product);
      }
    });
  }
  product_filter_local({product,option,cate_id=""}){
    return new Promise<any>((resolve,reject) => {
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
          resolve(filter);
        }else{
          resolve(product);
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
          resolve(filter);
        }else{
          resolve(product);
        }
        
      }
    });
  }
  product_filterPhp({load = false,cate_id="",option}){
    return new Promise<any>((resolve,reject) => {
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
          this.db(query).then(callback=>{
            if(callback){
              //console.log("Callback",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
    });
  }

  product_single({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          json:{
            table:"json_product_single",
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.product_single,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }

  product_barcode({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        firebase:{
          table:table.product_barcode,
          loading:load
        }
      }
      this.db(query).then(callback=>{
        resolve(callback.data || null);
      });
    });
  }

  product_filter({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        firebase:{
          table:table.product_filter,
          loading:load,
          type:"object",
        }
      }
      this.db(query).then(callback=>{
        resolve(callback || null);
      });
    });
  }
  product_categoryAll({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_product_category",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let categories = {
          firebase:{
            table:table.product_category,
            loading:load
          }
        }
        this.db(categories).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  product_category({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_product_category",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("CATEEE",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let categories = {
          firebase:{
            table:table.product_category,
            loading:load
          }
        }
        this.db(categories).then(callback=>{
          if(callback.data){
            callback.data = this.unflatten(callback.data);
          }
          resolve(callback.data || null);
        });
      });
    }
    
  }
  product_category_filter_id({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
          let query = {
            json:{
              table:"json_category_filter_id/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("Filter",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(categories).then(callback=>{
          resolve(callback.data[0] || null);
        });
      });
    }
  }
  product_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
          let query = {
            json:{
              table:"json_product_single_id/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
              //console.log("DETAIL",callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.product_single+"/"+id,
            type:"object",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          resolve(callback || null);
        });
      });
    }
    
  }
  product_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
          let query = {
            json:{
              table:"json_product_category_id/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  product_store({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
          let query = {
            json:{
              table:"json_store",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.product_store,
            loading:load
          }
        }
        this.db(query).then(callback=>{
         resolve(callback.data || null);
        });
      });
    }
  }

  product_listAll({load=false}){
    //let local = "product_listAll";
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
          let query = {
            json:{
              table:"json_product_list",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
          let query = {
            firebase:{
              table:table.product_list,
              loading:load
            }
          }
          this.db(query).then(callback=>{
           resolve(callback.data || null);
          });
      });
    }
    
  }
  product_listPagination({load=false,lastkey="",limit=0}){
    return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback || null);
        });
    });
  }
  product_coupon({load=false,title}){
    return new Promise<any>((resolve,reject)=>{
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
      this.db(query).then(callback=>{
        resolve(callback.data?callback.data[0]:null);
      });

    });
  }
  product_couponUsed({load=false,id}){
    return new Promise<any>((resolve,reject)=>{
        let query = {
              firebase:{
                  table:table.order_single,
                  orderBy:{
                    type:"promotion_id/promotion_"+id,
                    equal:true
                  }
              }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });  
    });
  }
  product_couponTime({load=false,userId,id}){
    return new Promise<any>((resolve,reject)=>{
        let query = {
                firebase:{
                       table:table.order_single,
                       orderBy:{
                         type:"created_by_promo/"+userId+"_promotion_"+id,
                         equal:true
                       }
                }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || []);
        });
    });
  }
  product_type({type,load=false,limit = 0}){
    if(this.getDatabase() == dbMysql){
      switch(type){
        case "new":
          type = "show_new"
          break;
        case "sale":
          type = "show_sale"
          break;
      }
      return new Promise((resolve,reject) => {
        let query = {
          json:{
            table:"json_product_type/"+type,
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        })
      });
    }
  }


  //listing
  listing_category({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
        let query = {
          json:{
            table:"json_listing_category",
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let queryCate = {
          firebase:{
            table:table.listing_category,
            loading:load
          }
        }
        this.db(queryCate).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  listing_home({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        firebase:{
          table:"listing_home",
          loading:load
        }
      }
      this.db(query).then(callback=>{
        resolve(callback.data || null);
      });
    });
  }
  listing_featured({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
        let query = {
          json:{
            table:"json_listing_featured",
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  listing_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
        let query = {
          json:{
            table:"json_listing_list_category_id/"+id,
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.listing_single,
            loading:true,
            orderBy:{
              type:"category",
              equal:id
            }
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  listing_listAll({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
        let query = {
          json:{
            table:"json_listing_single",
            method:"get",
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          if(callback){
            resolve(callback);
          }else{
            resolve(0);
          }
        });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
              firebase:{
                table:table.listing_single,
                loading:load
              }
        }
        this.db(query).then(callback=>{
            resolve(callback.data || null);
        });
      });
    }
  }

  //navigation
  navigations({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_navigation",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("CALLBACK",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
            firebase:{
              table:table.navigation+"/mobile/navigations",
              loading:load,
              type:"object"
            }
        }
        this.db(query).then(callback=>{
          resolve(callback);
        });
      }); 
    }
  }

  //gallery
  gallery_category({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_gallery_category",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("Gallery Cate:",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.gallery_category,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        })
      });
    }
  }
  gallery_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_gallery_single_id/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("Gallery List:",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.gallery_single+"/"+id,
            loading:load,
            type:"object"
          }
        }
        this.db(query).then(callback=>{
          resolve(callback || null);
        })
      });
    }
  }
  gallery_list({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_gallery_category_list_id/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              //console.log("Gallery List:",callback);
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          //console.log("Firebase List:",callback.data);
          resolve(callback.data || null);
        });
      });
    }
  }
  gallery_single({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_gallery_single",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.gallery_single,
            loading:load,
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }

  //page
  page_detail({load=false,slug,lang="en"}){
      if(this.getDatabase() == dbMysql){
        return new Promise<any>((resolve,reject) => {
            let query = {
              json:{
                table:"json_page_single_id/"+slug,
                method:"get",
                loading:load,
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
        });
      }else if(this.getDatabase() == dbFirebase){
        return new Promise<any>((resolve,reject)=>{
          let query = {
            firebase:{
              table:table.page_single+"/"+slug+"_"+lang,
              loading:load,
              type:"object"
            }
          }
          this.db(query).then(callback=>{
            resolve(callback || null);
          });
        });
      }
  }
  page_single({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
          let query = {
            json:{
              table:"json_page_single",
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.page_single,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }

  //portfolio
  portfolio_categories({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
            let query = {
              json:{
                table:"json_portfolio_category",
                method:"get",
                loading:load,
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.portfolio_category,
            loading:load
          }

        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  portfolio_detail({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
            let query = {
              json:{
                table:"json_portfolio_single_id/"+id,
                method:"get",
                loading:load,
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                //console.log("Portfolio List: ",callback);
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  portfolio_single({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
            let query = {
              json:{
                table:"json_portfolio_single",
                method:"get",
                loading:load
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.portfolio_single,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }

  //order
  order_single({load=false}){
    return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.order_single,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
    });
  }
  order_user({load=false}){
    return new Promise<any>((resolve,reject)=>{
      this._site.getUser().then(user=>{
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
          this.db(query).then(callback=>{
            resolve(callback.data || null);
          });
        }else{
          resolve(0);
        }
      });
    });
  }
  order_today({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise<any>((resolve,reject) => {
            let query = {
              json:{
                table:"json_order_today",
                method:"get",
                loading:load,
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }
    else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
    
  }
  order_address({load=false,id}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
            let query = {
              json:{
                table:"json_address_user/"+id,
                method:"get",
                loading:load
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
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
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  order_gateway({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
            let query = {
              json:{
                table:"json_gateway",
                method:"get",
                loading:load
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.order_gateway,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }
  order_shipping({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        firebase:{
          table:table.order_shipping,
          loading:load
        }
      }
      this.db(query).then(callback=>{
        resolve(callback.data || null);
      });
    });
  }

  //user
  users_single({load=false}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
            let query = {
              json:{
                table:"json_users",
                method:"get",
                loading:load,
              }
            }
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.users_single,
            loading:load
          }
        }
        this.db(query).then(callback=>{
          resolve(callback.data || null);
        });
      });
    }
  }

  //stream
  stream_signup({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        firebase:{
          table:table.stream_signup,
          loading:load
        }
      }
      this.db(query).then(callback=>{
        resolve(callback.data || null);
      });
    });
  }

  //images
  images({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        json:{
          table:"json_images",
          method:"get",
          loading:load,
        }
      }
      this.db(query).then(callback=>{
        if(callback){
          resolve(callback);
        }else{
          resolve(0);
        }
      });
    });
  }

  //form
  form_config({load=false}){
    return new Promise<any>((resolve,reject)=>{
      let query = {
        firebase:{
          table:table.form_config,
          loading:load,
          type:"object"
        }
      }
      this.db(query).then(callback=>{
        resolve(callback || null);
      });
    });
  }

  //authen
  auth_site({site,load=false}){
    return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.site_list+site,
            withoutSite:true,
            loading:load,
            type:"object"
          }
        }
        this.db(query).then(callback=>{
          resolve(callback || null);
        });
      });
  }

  auth_user({username,password,load=false,hash=""}){
    if(this.getDatabase() == dbMysql){
      return new Promise((resolve,reject) => {
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
            this.db(query).then(callback=>{
              if(callback){
                resolve(callback);
              }else{
                resolve(0);
              }
            });
      });
    }else if(this.getDatabase() == dbFirebase){
      return new Promise<any>((resolve,reject)=>{
        let query = {
          firebase:{
            table:table.users_single+'/'+hash,
            loading:load,
            type:"object"
          }
        }
        this.db(query).then(callback=>{
          resolve(callback || null);
        });
      });
    }
  }


}
