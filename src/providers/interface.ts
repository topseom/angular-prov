// Database
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
    stream_signup:"stream_signup",
    form_config:"form/config",
    images:"images",
    site_list:"SITE/site_list/"
}
export const dbFirebase = "firebase";
export const dbFirestore = "firestore";
export const dbMysql = "json";

export const baseUrl = "https://seven.co.th/";
export const jsonController = "domains/application/";
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



