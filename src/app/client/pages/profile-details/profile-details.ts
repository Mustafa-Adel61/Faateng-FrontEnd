import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth';
import { SharedPageHeader } from '../../../Shared/shared-layout/shared-page-header/shared-page-header';
import { SharedProfileDetails } from "../../../Shared/shared-components/shared-profile-details/shared-profile-details";

@Component({
  selector: 'app-profile-details',
  imports: [FormsModule, NgFor, NgIf, SharedPageHeader, SharedProfileDetails],
  templateUrl: './profile-details.html',
  styleUrl: './profile-details.css'
})
export class ProfileDetails implements OnInit {
   activeTab = 'Profile Details';
  user: any = {
    fullName: '',
    projectName: '',
    position: '',
    phone: '',
    email: ''
  };

  editableFields: any = {
    phone: false,
    email: false
  };

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // لو البيانات متخزنة في localStorage
    const currentUser = this.auth.getUser() || JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser) {
      this.user = {
        fullName: currentUser.fullName || 'My Name',
        projectName: currentUser.projectName || '4 Seasons Boulevard',
        position: currentUser.position || 'Project Owner',
        phone: currentUser.phone || '+201025633302',
        email: currentUser.email || 'myemail@company.com',
        password: currentUser.password || '******'
      };
    }
   console.log(currentUser);

  }

  enableEdit(field: string) {
    this.editableFields[field] = true;
  }

  saveChanges() {
    console.log('Updated user:', this.user);
    // مثال: send update to backend
    this.auth.updateUser(this.user);
    localStorage.setItem('user', JSON.stringify(this.user));
    this.editableFields = { phone: false, email: false };
    alert('Changes saved successfully!');
  }

  changeTab(tab: string) {
    this.activeTab = tab;
  }
}
