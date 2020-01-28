import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatSnackBar, PageEvent } from '@angular/material';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-email-template-list',
  templateUrl: './email-template-list.component.html',
  styleUrls: ['./email-template-list.component.css']
})
export class EmailTemplateListComponent implements OnInit {

  displayedColumns: string[] = ['no.', 'type', 'subject', 'date', 'action'];
  dataSource = new MatTableDataSource();

  public confirmClicked = false;
  public cancelClicked = false;


  pageIndex = 0;
  pageLimit = [5, 10, 15];


  limitEmail = 10;

  totalEmailLength = 0;

  search = undefined;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit() {
    this.gettingAllEmailTemplate();
  }



  gettingAllEmailTemplate() {
    this.userService.allEmailTemplate(this.pageIndex, this.limitEmail, this.search).subscribe((email) => {
      if (email) {
        this.dataSource.data = email.email;
        this.totalEmailLength = email.count;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


  // searching in Users
  searchTemplate(value: any) {
    this.search = value;
    this.gettingAllEmailTemplate();
  }



  // chnage limit and previous next button in Users
  getAllTemplate(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitEmail = event.pageSize;
    this.gettingAllEmailTemplate();
  }


  redirectAfterConfirmation(id: any) {
    this.router.navigate(['/editTemplate/', id]);
  }


  deleteTemplate(id: any) {
    this.userService.deleteEmailTemplate(id).subscribe((result) => {
      if (result) {
        if (result.success === true) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.gettingAllEmailTemplate();
        }
        if (result.success === false) {
          this.snackBar.open(result.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
          this.gettingAllEmailTemplate();
        }
      }
    });
  }

}
