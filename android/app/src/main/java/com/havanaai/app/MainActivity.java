package com.havanaai.app;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
public class MainActivity extends Activity {
 private WebView web;
 @Override protected void onCreate(Bundle savedInstanceState){
  super.onCreate(savedInstanceState);
  web=new WebView(this); setContentView(web);
  WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
  web.setWebViewClient(new WebViewClient()); web.setWebChromeClient(new WebChromeClient());
  web.loadUrl("https://havanaai-1.onrender.com/");
 }
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}
