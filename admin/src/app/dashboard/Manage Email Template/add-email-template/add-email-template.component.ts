import { Component, OnInit } from '@angular/core';
import { ToolbarService, LinkService, ImageService, HtmlEditorService, TableService } from '@syncfusion/ej2-angular-richtexteditor';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MatSnackBar } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { TemplateBinding } from '@angular/compiler';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-email-template',
  templateUrl: './add-email-template.component.html',
  styleUrls: ['./add-email-template.component.css'],
  providers: [ToolbarService, LinkService, ImageService, HtmlEditorService, TableService]
})
export class AddEmailTemplateComponent implements OnInit {


  public tools: object = {
    items: [
      'Bold', 'Italic', 'Underline', 'StrikeThrough', '|',
      'FontName', 'FontSize', 'FontColor', 'BackgroundColor', '|',
      'LowerCase', 'UpperCase', '|', 'Undo', 'Redo', '|',
      'Formats', 'Alignments', '|', 'OrderedList', 'UnorderedList', '|',
      'Indent', 'Outdent', '|', 'CreateLink', 'CreateTable',
      'Image', '|', 'ClearFormat', 'Print', 'SourceCode']
  };

  public insertImageSettings: object = {
    saveUrl: `${environment.apiEndPoint}admin/emailTemplateImage`,
    path: `${environment.templateImage}`,
    removeUrl: `${environment.apiEndPoint}admin/removeImage`,
  };


  templateId: any;


  newEmailTemplateForm = new FormGroup({
    mailType: new FormControl('', [Validators.required]),
    subject: new FormControl('', [Validators.required]),
    emailBody: new FormControl('', [Validators.required]),
    subjectFarsi: new FormControl('', [Validators.required]),
    emailBodyFarsi: new FormControl('', [Validators.required]),
  });

  constructor(
    private userService: UserService,
    private snack: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    if (this.route.snapshot.routeConfig.path === 'editTemplate/:templateId') {
      this.newEmailTemplateForm.addControl('templateId', new FormControl([Validators.required]));
      this.templateId = this.route.snapshot.params.templateId;
      this.getUniqueTemplate(this.templateId);
    }
  }


  getUniqueTemplate(templateId) {
    this.userService.getUniqueEmailTemplate(templateId).subscribe((template) => {
      if (template) {
        this.newEmailTemplateForm.setValue({
          templateId: template._id,
          mailType: template.mailType,
          subject: template.subject,
          emailBody: template.emailBody,
          subjectFarsi: template.subjectFarsi,
          emailBodyFarsi: template.emailBodyFarsi
        });
      }
    });
  }


  // convenience getter for easy access to form fields
  get controls() { return this.newEmailTemplateForm.controls; }


  addTemplate() {
    if (this.newEmailTemplateForm.invalid) {
      return false;
    } else {
      this.userService.createTemplate(this.newEmailTemplateForm.value).subscribe((template) => {
        if (template.success === true) {
          this.snack.open(template.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.router.navigate(['template-list']);
          // this.newEmailTemplateForm.markAsPristine
        } else if (template.success === false) {
          this.snack.open(template.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
      }, error => {
        this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      });
    }
  }


  updateTemplate() {
    if (this.newEmailTemplateForm.invalid) {
      return false;
    } else {
      this.userService.editEmailTemplate(this.newEmailTemplateForm.value).subscribe((template) => {
        if (template.success === true) {
          this.snack.open(template.msg, 'X', { duration: 4000, panelClass: ['info-snackbar'], horizontalPosition: 'end' });
          this.router.navigate(['template-list']);
        } else if (template.success === false) {
          this.snack.open(template.msg, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
        }
      }, error => {
        this.snack.open(error.message, 'X', { duration: 4000, panelClass: ['error-snackbar'], horizontalPosition: 'end' });
      });
    }
  }

}
