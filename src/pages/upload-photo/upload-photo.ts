import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform  } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from "angularfire2/firestore";
import { AngularFireAuth } from "angularfire2/auth";
import firebase from "firebase";
import { Camera, File, Crop } from 'ionic-native';
import { Observable } from 'rxjs/Observable';
import { ProfileUser } from '../../Models/ProfileUser';



declare var window: any;

@IonicPage()
@Component({
  selector: 'page-upload-photo',
  templateUrl: 'upload-photo.html',
})
export class UploadPhotoPage {

  profileuser = {} as ProfileUser;
  photoURL:string;
  
  userData: AngularFirestoreDocument<ProfileUser>
  userDetails: Observable<ProfileUser>

  public options ={
    allowEdit: true,
    sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
    mediaType: Camera.MediaType.ALLMEDIA,
    desinationType: Camera.DestinationType.FILE_URI,
    targetWidth: 180,
    targetHeight: 180,
    
  }

  public Fbref: any;

  constructor(  public navCtrl: NavController,
                public navParams: NavParams,
                public platform: Platform,
                private fire: AngularFireAuth,
                private database: AngularFirestore,
              ){
        
        this.navParams = navParams; 
        this.Fbref = firebase.storage().ref()  
        
      //firebase profile data Observable
      this.fire.authState.take(1).subscribe(data=>{
      this.userData = this.database.doc(`ProfileUser/${data.uid}`)
      this.userDetails = this.userData.valueChanges();
       });
     
  }

/////////////////////////////////////////////CROP + UPLOAD FOR FIREBASE STORAGE//////////////////////////
    
  // Return a promise to catch errors while loading image
  getMedia(): Promise<any> {
    // Get Image from ionic-native's built in camera plugin
    return Camera.getPicture(this.options)
      .then((fileUri) => {
        // Crop Image, on android this returns something like, '/storage/emulated/0/Android/...'
        // Only giving an android example as ionic-native camera has built in cropping ability
        if (this.platform.is('ios')) {
          return fileUri
        } else if (this.platform.is('android')) {
          // Modify fileUri format, may not always be necessary
          fileUri = 'file://' + fileUri;
          /* Using cordova-plugin-crop starts here */
        return Crop.crop(fileUri, { quality: 100 });
      }
      }).then((path) => {
         // path looks like 'file:///storage/emulated/0/Android/data/com.foo.bar/cache/1477008080626-cropped.jpg?1477008106566'
        //  console.log('Cropped Image Path!: ' + path);
        path; // return the path of file
        window.resolveLocalFileSystemURL(path, FE=>{
          FE.file(file=>{
             const FR=new FileReader()
             FR.onloadend = ((res: any)=>{
               let AF=res.target.result
               let blob=new Blob([new Uint8Array(AF)], {type: 'image/jpg'}); 
               this.upload(blob)
               this.savephotoURL()  //get url of the image             
             });
             FR.readAsArrayBuffer(file);
             })
           })
         })
       }
       
       upload(blob:Blob){
         const currentUserId = this.fire.auth.currentUser.uid; // get user UID in firebase
         this.Fbref.child(`Profile/${currentUserId}/img`).put(blob); //path in firebase storage
         
}
       
/////////////////////////////////////////////End CROP + UPLOAD FOR FIREBASE STORAGE//////////////////////////


////////////////////////// GET AND SAVE URL IMAGE IN DATABASE FIRESTORE//////////////////////

savephotoURL(){
  const currentUserId = this.fire.auth.currentUser.uid;
  this.Fbref.child(`Profile/${currentUserId}/img` ).getDownloadURL().then(function(url){
  // console.log("the URL Image is: " + url);
  let imageURL = url
  return imageURL
}).then((imageURL) => {
   // save url in cloud Firestore // !!!! IMPORTANT select UPDATE or SET
  this.database.doc(`ProfileUser/${currentUserId}/`).set({photoURL:imageURL})  })
}



skip(){

  this.navCtrl.setRoot(UploadPhotoPage) //Go Skip Page select
}




}//close tags
