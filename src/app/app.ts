import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('dnamic-dashboard-builder');

  //ng build --configuration production --base-href /dnamic-dashboard-builder/
  //npx angular-cli-ghpages --dir=dist/dnamic-dashboard-builder/browser
}
