import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-view',
  imports: [],
  templateUrl: './dashboard-view.html',
  styleUrl: './dashboard-view.scss',
})
export class DashboardView {
  private router =inject(Router);

  goBack():void{
    this.router.navigate(['/builder']);
  }
}
