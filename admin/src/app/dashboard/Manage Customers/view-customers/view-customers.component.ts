import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { MatTableDataSource, MatPaginator, MatSnackBar, PageEvent } from '@angular/material';

@Component({
  selector: 'app-view-customers',
  templateUrl: './view-customers.component.html',
  styleUrls: ['./view-customers.component.css']
})
export class ViewCustomersComponent implements OnInit {

  users: any;
  displayedColumns: string[] = ['firstname', 'lastname', 'email', 'phone', 'status', 'registrationDate', 'action'];
  dataSource = new MatTableDataSource();




  pageIndex = 0;
  pageLimit = [5, 10, 15];


  limitUser = 10;

  totalUserLength = 0;

  search = undefined;


  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.gettingAllUsersDetails();
  }


  gettingAllUsersDetails() {
    this.userService.allUsersDetails(this.pageIndex, this.limitUser, this.search).subscribe((users) => {
      if (users) {
        this.dataSource.data = users.users;
        this.totalUserLength = users.count;
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }



  // searching in Users
  searchUsers(value: any) {
    this.search = value;
    this.gettingAllUsersDetails();
  }



  // chnage limit and previous next button in Users
  getAllUsers(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.limitUser = event.pageSize;
    this.gettingAllUsersDetails();
  }

  approveProfile(userId: any, approvalType: any) {
    let approvalTypes;
    if (approvalType === 'pending') {
      approvalTypes = 'active';
    }
    if (approvalType === 'active') {
      approvalTypes = 'pending';
    }
    const userDetails = {
      id: userId,
      approval: approvalTypes
    };

    this.userService.approveUserProfile(userDetails).subscribe((response) => {
      if (response) {
        if (response.success === true) {
          this.gettingAllUsersDetails();
          this.snackBar.open(response.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
        }
      }
    }, error => {
      this.snackBar.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
    });
  }


}
