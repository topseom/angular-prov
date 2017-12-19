let devMode = "";

export const App = {
  "app": "ecate", 
  "theme": "1", 
  "platform": "mobile", 
  "demo":true,
  "erp": {
    "database":"firebase",
    "json_table": [
      "users_single"+devMode,
      "product_stock"+devMode,
      "product_barcode"+devMode,
      "product_store"+devMode,
      "order_single"+devMode,
      "product_list"+devMode,
      "product_single"+devMode,
      "product_category"+devMode
    ],
    "social_auth":{
      "web":{
        "google":"115935075964-samiqco9too2pqtq0dos5e5tmabg3kov.apps.googleusercontent.com",
        "facebook":"2029449827270031"
      },
      "mobile":{
        "google":"",
        "facebook":""
      }
    }
  },
  "pos": {
    "database":"firebase",
    "json_table": [
      "banner_single"+devMode,
      "order_single"+devMode,
      "users_single"+devMode,
      "product_stock"+devMode,
      "product_barcode"+devMode,
      "product_store"+devMode,
      "order_single"+devMode,
      "product_list"+devMode,
      "product_single"+devMode,
      "product_category"+devMode
    ],
    "social_auth":{
      "web":{
        "google":"115935075964-samiqco9too2pqtq0dos5e5tmabg3kov.apps.googleusercontent.com",
        "facebook":"2029449827270031"
      },
      "mobile":{
        "google":"",
        "facebook":""
      }
    }
  },
  "ecom": {
    "database":"firebase",
    "baseUrl":"https://eshop.ijustdemo.com/",
    "json_table": [
      "users_single"+devMode,
      "banner_single"+devMode,
      "product_list"+devMode,
      "product_single"+devMode,
      "product_category"+devMode,
      "blog_list"+devMode,
      "blog_categories"+devMode
    ],
    "social_auth":{
      "web":{
        "google":"115935075964-samiqco9too2pqtq0dos5e5tmabg3kov.apps.googleusercontent.com",
        "facebook":"2029449827270031"
      },
      "mobile":{
        "google":"",
        "facebook":""
      }
    }
  },
  "listing": {
    "database":"firebase",
    "json_table": [
      "users_single"+devMode,
      "listing_single"+devMode,
      "listing_category"+devMode,
      "blog_list"+devMode,
      "blog_categories"+devMode
    ],
    "social_auth":{
      "web":{
        "google":"115935075964-samiqco9too2pqtq0dos5e5tmabg3kov.apps.googleusercontent.com",
        "facebook":"2029449827270031"
      },
      "mobile":{
        "google":"",
        "facebook":""
      }
    }
  },
  "ecate": {
    "database":"json",
    "baseUrl":"https://maleea.ijustdemo.com/",
    "json_table": [
      "users_single"+devMode,
      "page_single"+devMode,
      "blog_list"+devMode,
      "blog_categories"+devMode,
      "product_list"+devMode,
      "product_single"+devMode,
      "product_category"+devMode,
      "portfolio_single"+devMode,
      "portfolio_categories"+devMode,
      "gallery_category"+devMode,
      "gallery_single"+devMode
    ],
    "social_auth":{
      "web":{
        "google":"115935075964-samiqco9too2pqtq0dos5e5tmabg3kov.apps.googleusercontent.com",
        "facebook":"2029449827270031"
      },
      "mobile":{
        "google":"",
        "facebook":""
      }
    }
  },
  "news": {
    "database":"firebase",
    "json_table": [
      "users_single"+devMode,
      "banner_single"+devMode,
      "blog_list"+devMode,
      "blog_categories"+devMode,
      "page_single"+devMode,
      "navigations"+devMode
    ],
    "social_auth":{
      "web":{
        "google":"115935075964-samiqco9too2pqtq0dos5e5tmabg3kov.apps.googleusercontent.com",
        "facebook":"2029449827270031"
      },
      "mobile":{
        "google":"",
        "facebook":""
      }
    }
  }
}