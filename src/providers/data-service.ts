import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { StorageService } from './storage-service';
import { QueryService,Options } from './query-service';
import { dbFirebase,table,api, dbFirestore, dbMysql } from './interface';
import * as _ from 'lodash';

export interface ConfigFilter{
	parent_key?:string,
	key:string;
	value:string | boolean;
	object?:boolean;
}

export interface Config{
	table:string;
	options?:Options;
	offlineMode?:boolean;
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

	async build_tree(nodes){
		nodes = nodes.sort((a,b)=> a['parent']-b['parent'] );
		let map = {}, node, roots = [];
		for (var i = 0; i < nodes.length; i += 1) {
				   node = nodes[i];
				   node['children'] = [];
				   map[node.id] = i;
				   node.parent = node.parent.toString();
				   if (node.parent !== "0") {
					 if(roots[map[node.parent]]){
					   roots[map[node.parent]]['children'].push(node);
					 }
				   }else{
					 roots.push(node);
				   }
		}
		return roots;
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
		if(setting.offline && config.offlineMode){
			let data = await this._storage.getLocalData(config.table);
			if(data && config.filter){
				if(config.filter.parent_key){
					data = _.filter(data,function(o) { return _.get(o,''+config.filter.parent_key+'.'+config.filter.key+'') == config.filter.value; });
				}else{
					data = _.filter(data,function(o){return o[config.filter.key] == config.filter.value});
				}
				if(config.filter.object){
					data = data[0];
				}
			}
			return data;
		}else{
			console.log("CONFIG",config);
			//let data = await config.query.func.bind(this._query)(config.query.param);
			let data = await this._query.query(config.table,config.options);
			console.log("DATA",data);
			return data;
		}
	}

    async banner_home({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.banner_single,
			offlineMode,
			options:new Options({ loading:load,where:[{key:'slug',value:'mester-banner'}],method:"get",api:api.banner_single }),
			filter:{
				key:"slug",
				value:"mester-banner"
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async banner_slug({slug,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.banner_single,
			offlineMode,
			options:new Options({ loading:load,where:[{key:'slug',value:slug}],method:"get",api:api.banner_single }),
			filter:{
				key:"slug",
				value:slug
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async navigation({load=true,offlineMode=true,slide=false,slide_limit=10}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.navigation,
			offlineMode,
			options:new Options({ lang:true,loading:load,where:[{key:'abbrev',value:'mobile'}],method:"get",api:api.navigation })
		}
		let callback = await this.data_generate(option);
		callback = callback[0].navigations ? callback[0].navigations : callback;
		//console.log("CALLBACK",callback);
		if(slide){
			let module = await this.slideModuleInit(callback,slide_limit);
			return module;
		}
		return callback;
  }

  async blog_categories({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_category,
			offlineMode,
			options:new Options({ lang:true,loading:load,method:"get",api:api.blog_category })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
    async blog_list({id,load=true,offlineMode=true,limit=0,page=0}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_list,
			offlineMode,
			options:new Options({ lang:true,limit,page,loading:load, where:[{key:"category",value:id }] ,method:"get",api:api.blog_list_category+"/"+id}),
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async blog_type({type,load=true,offlineMode=true,limit=0,page=0}):Promise<any>{
		let type_json = type;
		switch(type){
			case "featured":
			  type_json = "featured_blog";
			  break;
		  }
		let option:Config;
		option = {
			table:table.blog_list,
			offlineMode,
			options:new Options({ lang:true,limit,page,loading:load,where:[{key:type,value:'1'}],method:"get",api:api.blog_list_type+"/"+type}),
			filter:{
				key:type,
				value:"1"
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async blog_detail({id,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.blog_list,
			offlineMode,
			options:new Options({ lang:true,loading:load,type:"object",table_path:id,method:"get",api:api.blog_list_id+"/"+id}),
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  	}
	
  async gallery_single({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_single,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.gallery_single })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	
  async gallery_category({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_category,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.gallery_category })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
  async gallery_list({id,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_single,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"category",value:id}],method:"get",api:api.gallery_list_category+"/"+id }),
			filter:{ key:"category",value:id }
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
  async gallery_detail({id,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.gallery_single,
			offlineMode,
			options:new Options({ loading:load,type:"object",table_path:id,method:"get",api:api.gallery_list_id+"/"+id }),
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  }

  async portfolio_category({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.portfolio_category,
			offlineMode,
			options:new Options({ lang:true,loading:load,method:"get",api:api.portfolio_category })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	  
  async portfolio_list({id,load=true,offlineMode=true,limit=0,page=0}):Promise<any>{
		let option:Config;
		option = {
			table:table.portfolio_single,
			offlineMode,
			options:new Options({ lang:true,limit,page,loading:load,where:[{key:"category",value:id}],method:"get",api:api.portfolio_list_category+"/"+id }),
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
  }
	async page_single({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.page_single,
			offlineMode,
			options:new Options({ lang:true,loading:load,method:"get",api:api.page_single})
		}
		let callback = await this.data_generate(option);
		return callback['body'];
	}
	async page_detail({slug,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.page_single,
			offlineMode,
			options:new Options({ lang:true,loading:load,where:[{key:"slug",value:slug}],method:"get",api:api.page_list_id+"/"+slug}),
			filter:{
				key:"slug",
				value:slug,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		callback = callback[0] ? callback[0] : callback;
		return callback['body'];
	}

	async product_categories_list({product=[],cate_id=[]}={}){
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
	  
  	async product_detail({id,load=true,offlineMode=true,withOption=false}):Promise<any>{
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
			offlineMode,
			options:new Options({ loading:load,type:"object",table_path:id,method:"get",api:api.product_single_id+"/"+id }),
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

	async product_single({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_single,
			offlineMode,
			options:new Options({ loading:load,method:"get", api:api.product_single })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  	async product_list({id,load=true,offlineMode=true,limit=0,page=0}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offlineMode,
			options:new Options({ loading:load,page,limit,where:[({key:"category/category_"+id,value:true} as any)],method:"get",api:api.product_category_id+"/"+id }),
			filter:{
				parent_key:"category",
				key:"category_"+id,
				value:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async product_store({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_store,
			offlineMode,
			options:new Options({ loading:load,method:"get", api:api.product_store })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  	async product_listAll({load=true,offlineMode=true,limit=0,page=0}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offlineMode,
			options:new Options({ loading:load,limit,page,method:"get", api:api.product_list })
		}
		let callback = await this.data_generate(option);
		return callback;
   }

  	async product_type({type,load=true,limit=0,offlineMode=true}):Promise<any>{
		let type_json;
		switch(type){
			case "new":
			  type_json = "show_new"
			  break;
			case "sale":
			  type_json = "show_sale"
			  break;
		}
		let option:Config;
		option = {
			table:table.product_list,
			offlineMode,
			options:new Options({ loading:load,method:"get",limit, api:api.product_type+"/"+type,where:[{key:type,value:"1"}] }),
			filter:{
				key:type,
				value:"1"
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async product_category_id({id,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_category,
			offlineMode,
			options:new Options({ loading:load,type:"object",table_path:id,method:"get",api:api.product_list_category_filter+"/"+id }),
			filter:{
				key:"id",
				value:id,
				object:true
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async product_category({load=true,offlineMode=true,buildTree=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_category,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.product_category })
		}
		let callback = await this.data_generate(option);
		if(buildTree){
			callback = await this.build_tree(callback);
		 }
		return callback;
	}

  async product_search({search,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_list,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.product_list})
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

	async product_barcode({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_barcode,
			offlineMode,
			options:new Options({ loading:load })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
	
	async product_coupon({title,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.product_promotion,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"conditions/coupon_title",value:title}] })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async product_couponUsed({id,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_single,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"promotion_id/promotion_"+id,value:(true as any)}] })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async product_couponTime({userId,id,offlineMode=true,load=false}){
		let option:Config;
		option = {
			table:table.order_single,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"created_by_promo/"+userId+"_promotion_"+id,value:(true as any)}] })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  	async product_filter({option,product,load=true,cate_id=""}):Promise<any>{
		let setting = await this._storage.getSetting();
		if(setting.offline || this._query.getDatabase() == dbFirebase || this._query.getDatabase() == dbFirestore){
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
		}else{
			let option_config:Config;
			option_config = {
				table:table.product_filter,
				options:new Options({ loading:load,method:"post",api:api.product_filter,data:{option,cate_id}  })
			}
			let callback = await this.data_generate(option_config);
			return callback;
		}
	}

  	async listing_featured({load=true,offlineMode=true,limit=0,groupByCate=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_single,
			offlineMode,
			options:new Options({ lang:true,limit,loading:load,where:[{key:"featured",value:"1"}],method:"get",api:api.listing_list_featured })
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

  async listing_list({id,load=true,offlineMode=true,limit=0,page=0}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_single,
			offlineMode,
			options:new Options({ lang:true,limit,page,loading:load,where:[{key:"category",value:id}],method:"get",api:api.listing_list_category+"/"+id }),
			filter:{
				key:"category",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async listing_listAll({load=true,offlineMode=true,limit=0,page=0}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_single,
			offlineMode,
			options:new Options({ lang:true,page,limit,loading:load,method:"get",api:api.listing_single })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async listing_category({load=true,offlineMode=true,buildTree=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.listing_category,
			offlineMode,
			options:new Options({ lang:true,loading:load,method:"get",api:api.listing_category })
		}
		let callback = await this.data_generate(option);
		if(buildTree){
		   callback = await this.build_tree(callback);
		}
		return callback;
	}
	  
  async order_address({id,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_address,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"created_by",value:id}],method:"get",api:api.order_address_user+"/"+id }),
			filter:{
				key:"created_by",
				value:id
			}
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async order_gateway({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_gateway,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.order_gateway })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async order_shipping({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_shipping,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:table.order_shipping })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

  async order_single({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.order_single,
			offlineMode,
			options:new Options({ loading:load })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
   async users_group({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.users_group,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"type_group",value:"user"}] })
		}
		let callback = await this.data_generate(option);
		return callback;
   }

   async stream_signup({load=true,offlineMode=true}={}):Promise<any>{
	    let option:Config;
	    option = {
		   table:table.stream_signup,
		   offlineMode,
		   options:new Options({ loading:load })
	    }
	   let callback = await this.data_generate(option);
		return callback;
   }

   async user_login({email,password,load=true,offlineMode=false}):Promise<any>{
		let option:Config;
		option = {
			table:table.users_single,
			offlineMode,
			options:new Options({ loading:load,where:[{key:"email",value:email}],data:{username:email,password:password},method:"post",api:api.user_login })
		}
		let callback = await this.data_generate(option);
		callback = callback[0]?callback[0]:callback;
		return callback;
   }
	
   async site_ref({ref,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.site_list,
			offlineMode,
			options:new Options({ 
				loading:load,
				database:dbMysql,
				data:{ ref },
				type:"post",
				api:api.site_single
			})
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async site_domain({domain,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.site_list,
			offlineMode,
			options:new Options({ 
				loading:load,
				database:dbMysql,
				data:{ domain },
				type:"post",
				api:api.site_single
			})
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async users_single({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.users_single,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.users_single })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async language({load=true,offlineMode=false}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.language,
			offlineMode,
			options:new Options({ loading:load,method:"get",api:api.language })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async form_config({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.form_config,
			offlineMode,
			options:new Options({ loading:load })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

    async form_config_type({type,load=true,offlineMode=true}):Promise<any>{
		let option:Config;
		option = {
			table:table.form_config,
			offlineMode,
			options:new Options({ loading:load,table_path:type,type:"object" })
		}
		let callback = await this.data_generate(option);
		return callback;
	}

	async app_setting({load=true,offlineMode=true}={}):Promise<any>{
		let option:Config;
		option = {
			table:table.app_setting,
			offlineMode,
			options:new Options({ loading:load,table_path:"0",type:"object",method:"get",api:api.app_setting })
		}
		let callback = await this.data_generate(option);
		return callback;
	}
}