import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // This points to your src/app/app.ts file

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));