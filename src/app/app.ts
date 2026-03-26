import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('dynamic-dashboard-builder');

  //ng build --configuration production --base-href /dynamic-dashboard-builder/
  //npx angular-cli-ghpages --dir=dist/dynamic-dashboard-builder/browser
}
