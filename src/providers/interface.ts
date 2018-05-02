// Database
export const api = {
    banner_single:"json_banner_home",
    product_list:"json_product_list",
    product_category:"json_product_category",
    product_category_id:"json_product_category_id",
    product_list_category_filter:"json_category_filter_id",
    product_single:"json_product_single",
    product_single_id:"json_product_single_id",
    product_filter:"json_product_filter",
    product_store:"json_store",
    product_type:"json_product_type",
    blog_category:"json_blog_categories",
    blog_list:"json_blog_list",
    blog_list_category:"json_blog_list_categories",
    blog_list_id:"json_blog_single_id",
    blog_list_type:"json_blog_type",
    gallery_category:"json_gallery_category",
    gallery_list_category:"json_gallery_category_list_id",
    gallery_single:"json_gallery_single",
    gallery_list_id:"json_gallery_single_id",
    listing_category:"json_listing_category",
    listing_list_category:"json_listing_list_category_id",
    listing_list_featured:"json_listing_featured",
    listing_single:"json_listing_single",
    listing_condition:"json_listing_condition",
    navigation:"json_navigation",
    page_single:"json_page_single",
    page_list_id:"json_page_single_id",
    portfolio_category:"json_portfolio_category",
    portfolio_list_category:"json_portfolio_single_id",
    portfolio_single:"json_portfolio_single",
    order_gateway:"json_gateway",
    order_address_user:"json_address_user",
    users_single:"json_users",
    user_login:"json_login",
    app_setting:"json_app_setting",
    language:"json_language",
    site_single:"json_site",
    user_single_insert:"json_users_single",
    user_single_stream:"json_users_single",
    order_single_insert:"json_order_single",
    order_address_insert:"json_order_address",
    order_address_delete:"json_order_address",
    order_address_update:"json_order_address"
}
export const table = {
    banner_single:"banner_single",
    navigation:"navigation",
    blog_category:"blog_categories",
    blog_list:"blog_list",
    gallery_category:"gallery_category",
    gallery_single:"gallery_single",
    portfolio_category:"portfolio_categories",
    portfolio_single:"portfolio_single",
    page_single:"page_single",
    product_single:"product_single",
    product_list:"product_list",
    product_category:"product_category",
    product_barcode:"product_barcode",
    product_filter:"product_filter",
    product_store:"product_store",
    product_promotion:"product_promotion",
    listing_single:"listing_single",
    listing_category:"listing_category",
    order_single:"order_single",
    order_address:"order_address",
    order_gateway:"order_gateway",
    order_shipping:"order_shipping",
    users_single:"users_single",
    users_group:"users_group",
    stream_signup:"stream_signup",
    app_setting:"app_setting",
    language:"language",
    form_config:"form/config",
    form_list:"form",
    form_users:"form/users",
    images:"images",
    site_list:"SITE/site_list/"
}

export const post = "post";

export const create = "create";
export const edit = "edit";

export const dbFirebase = "firebase";
export const dbFirestore = "firestore";
export const dbMysql = "json";

export const baseUrl = "https://uat.seven.co.th/";
export const jsonController = "domains/api/";
export const firebaseController = "domains/firebase/";

export interface FirebasePagination{
    lastkey?: string;
    limit: number;
}

export interface FirebaseOrderBy{
    type : string;
    equal?: string | boolean;
}


export interface FirebaseDb{
    table:string;
    type?:string;
    pagination?:FirebasePagination;
    realtime?:boolean;
    limit?: number;
    orderBy?:FirebaseOrderBy;
    loading?: boolean;
    cache?: boolean;
    data?:any;
    method?:string;
    withoutSite?:boolean;
}

export interface FirestoreDb{
    table:string;
    type?:string;
    pagination?:FirebasePagination;
    realtime?:boolean;
    limit?: number;
    orderBy?:FirebaseOrderBy;
    loading?: boolean;
    cache?: boolean;
    data?:any;
    method?:string;
    withoutSite?:boolean;
}

export interface JsonDb{
  table:string;
  method:string;
  data?:any;
  loading?:boolean;
}

export interface Database {
    firebase?:FirebaseDb | boolean;
    firestore?:FirestoreDb | boolean;
    json?:JsonDb | boolean;

}

export const textInternetConnectOffline = "Please connect the Internet";



