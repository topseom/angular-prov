import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { StorageService } from './storage-service';
import { QueryService } from './query-service';
import { dbFirebase,table } from './interface';
import * as _ from 'lodash';

export interface ConfigFilter{
	parent_key?:string,
	key:string;
	value:string | boolean;
	object?:boolean;
}

export interface Config{
	table:string;
	query:{func,param:object};
	offline?:boolean;
	filter?:ConfigFilter;
}

@Injectable()
export class DataService{
	test =[];
	constructor(public _storage:StorageService,public _query:QueryService,public alertCtrl:AlertController){}
	
    async slideModuleInit(module,limit):Promise<any>{
	   let module_slides = [];
       let index = 1;
       let begin,end = 0;
       let check = true;
       while(check){
          if(index == 1){
             begin = 0;
            end= (index*limit);
          }
          else{
            begin = ((index-1)*limit);
            end= begin+limit;
          }
          let array =[];
          for(let i=begin ;i<end;i++){
            if(module[i]){
              array.push(module[i]);
            }
          }
          if(array.length > 0){
            module_slides[index-1] = array;
          }
          index = index+1;
          if(array.length % limit != 0 || module[index] == null){
            check = false;
          }
	   }
	   return module_slides;
	}

    async page_module(module):Promise<any>{
		
			if(module.module_name != "0" && module.module_name != ""){
				let title = module.module_name;
				if(title == "blog"){
					return({module:"blog",param:{title:module.title}});
				}else if(title == "firesale"){
					return({module:"firesale",param:"0"});
				}else if(title == "pro_galleries"){
					return({module:"gallery",param:{title:module.title}});;
				}else if(title == "portfolio"){
					return({module:"portfolio",param:{title:module.title}});;
				}else{
					return(0);
				}
			}
			else if(module.uri == "" ||  module.uri == "#"){
				if(module.children && module.children.length){
					return({module:"children",param:{children:module.children,title:module.title}});
				}else{
					return({module:"page",param:{slug:module.url_mobile,title:module.title}});
				}
			}else{
				let array = ((module as any).uri).split("/");
				if(array[0] == "blog"){
					if(array[1] == "category"){
						return({module:"blog_category",param:{"id":array[2],"title":module.title}});
					}else{
						return({module:"blog_detail",param:{"id":array[1],"title":module.title}});
					}
				}else if(array[0] == "product"){
					if(array[1] == "category"){
						return({module:"product_category",param:{"category_id":array[2],"title":module.title}})
					}else{
						return({module:"product_detail"});
					}
				}else if(array[0] == "gallery"){
					if(array[1] == "category"){
						return({module:"gallery_category",param:{id:array[2],title:module.title}});
					}else{
						return({module:"gallery_detail",param:{id:array[1],title:module.title}});
					}
				}else if(array[0] == "portfolio"){
					if(array[1] == "category"){
						return({module:"portfolio_category",param:{id:array[2],title:module.title}});
					}else if(array[3]){
						return({module:"portfolio_detail",param:{id:array[2],item_id:array[3],title:module.title}});
					}
				}else if(array[0].indexOf("form") != -1){
					return({module:array[0],param:{title:module.title}});
				}else{
					let alert = this.alertCtrl.create({
						title: 'Attention',
						subTitle: 'Wrong URI!',
						buttons: [{
							text: 'Ok',
							handler: () => {
							
							}
						 }]
					});
					alert.present();
					return(0);
				}
			}
		
	}

    async data_generate(config:Config):Promise<any>{
		let setting = await this._storage.getSetting();
		if(setting.offline || config.offline){
			let callback = await this._storage.getLocalData(config.table);
			if(callback && config.filter){
				if(config.filter.parent_key){
					callback = _.filter(callback,function(o) { return _.get(o,''+config.filter.parent_key+'.'+config.filter.key+'') == config.filter.value; });
				}else{
					callback = _.filter(callback,function(o){return o[config.filter.key] == config.filter.value});
				}
				if(config.filter.object){
					callback = callback[0];
				}
			}
			return callback;
		}else{
			let callback = await config.query.func.bind(this._query)(config.query.param);
			return callback;
		}
	}
	  
    async banner_home({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.banner_single,
			offline:offline,
			query:{
				func:this._query.banner_home,
				param:{load:load}
			},
			filter:{
				key:"slug",
				value:"mester-banner"
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async navigation({load=true,offline=false,slide=false,slide_limit=10}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.navigation,
			offline:offline,
			query:{
				func:this._query.navigations,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		if(slide){
			let module = await this.slideModuleInit(callback,slide_limit);
			return module;
		}
		return callback;
  	}

    async blog_categories({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_category,
			offline:offline,
			query:{
				func:this._query.blog_categories,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
    async blog_list({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_list,
			offline:offline,
			query:{
				func:this._query.blog_list,
				param:{load:load,id:id}
			},
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async blog_type({type,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_list,
			offline:offline,
			query:{
				func:this._query.blog_type,
				param:{load:load,type:type}
			},
			filter:{
				key:type,
				value:"1"
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async blog_detail({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_list,
			offline:offline,
			query:{
				func:this._query.blog_detail,
				param:{load:load,id:id}
			},
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  	}


    async gallery_category({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_category,
			offline:offline,
			query:{
				func:this._query.gallery_category,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
    async gallery_list({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_single,
			offline:offline,
			query:{
				func:this._query.gallery_list,
				param:{load:load,id:id}
			},
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
    async gallery_detail({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_single,
			offline:offline,
			query:{
				func:this._query.gallery_detail,
				param:{load:load,id:id}
			},
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  	}

  	async portfolio_category({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.portfolio_category,
			offline:offline,
			query:{
				func:this._query.portfolio_categories,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
    async portfolio_list({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.portfolio_single,
			offline:offline,
			query:{
				func:this._query.portfolio_detail,
				param:{load:load,id:id}
			},
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  	}
	
    async page_detail({slug,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.page_single,
			offline:offline,
			query:{
				func:this._query.page_detail,
				param:{load:load,slug:slug}
			},
			filter:{
				key:"slug",
				value:slug,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback['body'];
	}
	  
    async product_detail({id,load=true,offline=false,withOption=false}):Promise<any>{
		let funcWithOption = (product)=>{
			let array = [];
            let index = -1;
            product.modifiers = JSON.parse(product.modifiers);
            Object.keys(product.modifiers).forEach(function(key){
                index = index +1;
                array.push(Object.assign({},product.modifiers[key]));  
                Object.keys(product.modifiers[key].variations).forEach(function(k){
                  if(array[index].variations instanceof Array){
                  }else{
                     array[index].variations = [];
                  }
                  array[index].variations.push(product.modifiers[key].variations[k]);
                });
            });
			product.modifiers = array;
			return product;
		};

		let option:Config;
		option = {
			table:table.product_single,
			offline:offline,
			query:{
				func:this._query.product_detail,
				param:{load:load,id:id}
			},
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		if(withOption){
			callback = funcWithOption(callback);
		}
		return callback;
	}

    async product_list({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offline:offline,
			query:{
				func:this._query.product_list,
				param:{load:load,id:id}
			},
			filter:{
				parent_key:"category",
				key:"category_"+id,
				value:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async product_listAll({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offline:offline,
			query:{
				func:this._query.product_listAll,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  	}

    async product_type({type,load=true,limit=0,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offline:offline,
			query:{
				func:this._query.product_type,
				param:{load:load,type:type,limit:limit}
			},
			filter:{
				key:type,
				value:"1"
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async product_category_id({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_category,
			offline:offline,
			query:{
				func:this._query.product_category_filter_id,
				param:{load:load,id:id}
			},
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async product_category({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_category,
			offline:offline,
			query:{
				func:this._query.product_category,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async product_search({search,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offline:offline,
			query:{
				func:this._query.product_listAll,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		if(callback){
			let products = [];
			(callback as any).forEach(data=>{
				if(data.title.toLowerCase().indexOf(search.toLowerCase()) != -1){
					products.push(data);
				}
			});
			return products;
		}
		return callback;
	}
	  
    async product_filter({option,product,load=true,cate_id=""}):Promise<any>{
		let setting = await this._storage.getSetting();
		if(setting.offline || this._query.getDatabase() == dbFirebase){
			let data = await this._query.product_filter_local({product:product,option:option});
			return data;
		}else{
			let data = await this._query.product_filterPhp({load:load,cate_id:cate_id,option:option});
			return data;
		}
	}

    async listing_featured({load=true,offline=false,groupByCate=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_single,
			offline:offline,
			query:{
				func:this._query.listing_featured,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		if(callback){
			callback = callback.filter(function(o,key){ return o.featured == "1"}) || false;
			if(groupByCate){
				callback = _.chain(callback).groupBy("category_title")
				.toPairs()
				.map(function(currentItem) {
						if(currentItem[0] != "undefined"){
							return _.zipObject(["title", "child"], currentItem);
						}
				})
				.compact()
				.value();
			}
		}
		return callback;
	}

    async listing_list({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_single,
			offline:offline,
			query:{
				func:this._query.listing_list,
				param:{load:load,id:id}
			},
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async listing_listAll({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_single,
			offline:offline,
			query:{
				func:this._query.listing_listAll,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async listing_category({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_category,
			offline:offline,
			query:{
				func:this._query.listing_category,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
    async order_address({id,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_address,
			offline:offline,
			query:{
				func:this._query.order_address,
				param:{load:load,id:id}
			},
			filter:{
				key:"created_by",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async order_gateway({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_gateway,
			offline:offline,
			query:{
				func:this._query.order_gateway,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async order_single({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_single,
			offline:offline,
			query:{
				func:this._query.order_single,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async users_single({load=true,offline=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.users_single,
			offline:offline,
			query:{
				func:this._query.users_single,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async form_config({type,load=true,offline=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.form_config,
			offline:offline,
			query:{
				func:this._query.form_config,
				param:{load:load}
			}
		}
		let callback = await this.data_generate(option);
		return callback[type];
	}
}