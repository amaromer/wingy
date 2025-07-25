import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/expenses',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expenses/expense-list/expense-list.component').then(m => m.ExpenseListComponent)
  },
  {
    path: 'expenses/create',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  },
  {
    path: 'expenses/quick',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expenses/quick-expense/quick-expense.component').then(m => m.QuickExpenseComponent)
  },
  {
    path: 'expenses/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  },
  {
    path: 'expenses/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expenses/expense-view/expense-view.component').then(m => m.ExpenseViewComponent)
  },
  {
    path: 'projects',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
  },
  {
    path: 'projects/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/projects/project-form/project-form.component').then(m => m.ProjectFormComponent)
  },
  {
    path: 'projects/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/projects/project-form/project-form.component').then(m => m.ProjectFormComponent)
  },
  {
    path: 'suppliers',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/suppliers/supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
  },
  {
    path: 'suppliers/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
  },
  {
    path: 'suppliers/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
  },
  {
    path: 'categories',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent)
  },
  {
    path: 'categories/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent)
  },
  {
    path: 'categories/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent)
  },
  {
    path: 'main-categories',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/main-categories/main-category-list/main-category-list.component').then(m => m.MainCategoryListComponent)
  },
  {
    path: 'main-categories/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/main-categories/main-category-form/main-category-form.component').then(m => m.MainCategoryFormComponent)
  },
  {
    path: 'main-categories/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/main-categories/main-category-form/main-category-form.component').then(m => m.MainCategoryFormComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'users/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
  },
  {
    path: 'users/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'received-payments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/received-payments/received-payment-list/received-payment-list.component').then(m => m.ReceivedPaymentListComponent)
  },
  // HR Module Routes
  {
    path: 'employees',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/employees/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
  },
  {
    path: 'employees/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
  },
  {
    path: 'employees/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
  },
  {
    path: 'payroll',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/payroll/payroll-list/payroll-list.component').then(m => m.PayrollListComponent)
  },
  {
    path: 'overtime',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/overtime/overtime-list/overtime-list.component').then(m => m.OvertimeListComponent)
  },
  {
    path: 'overtime/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/overtime/overtime-form/overtime-form.component').then(m => m.OvertimeFormComponent)
  },
  {
    path: 'overtime/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/overtime/overtime-form/overtime-form.component').then(m => m.OvertimeFormComponent)
  },
  {
    path: 'overtime/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/overtime/overtime-form/overtime-form.component').then(m => m.OvertimeFormComponent)
  },
  {
    path: 'received-payments/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/received-payments/received-payment-form/received-payment-form.component').then(m => m.ReceivedPaymentFormComponent)
  },
  {
    path: 'received-payments/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/received-payments/received-payment-form/received-payment-form.component').then(m => m.ReceivedPaymentFormComponent)
  },
  // HR Module Routes
  {
    path: 'employees',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/employees/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
  },
  {
    path: 'employees/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
  },
  {
    path: 'employees/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
  },
  {
    path: 'payroll',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/payroll/payroll-list/payroll-list.component').then(m => m.PayrollListComponent)
  },
  {
    path: 'payroll/create',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/payroll/payroll-form/payroll-form.component').then(m => m.PayrollFormComponent)
  },
  {
    path: 'payroll/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/payroll/payroll-form/payroll-form.component').then(m => m.PayrollFormComponent)
  },
  {
    path: 'payroll/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/payroll/payroll-view/payroll-view.component').then(m => m.PayrollViewComponent)
  },
  {
    path: 'petty-cash',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/petty-cash/petty-cash-list/petty-cash-list.component').then(m => m.PettyCashListComponent)
  },
  {
    path: 'petty-cash/credit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/petty-cash/petty-cash-credit/petty-cash-credit.component').then(m => m.PettyCashCreditComponent)
  },
  {
    path: 'petty-cash/debit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/petty-cash/petty-cash-debit/petty-cash-debit.component').then(m => m.PettyCashDebitComponent)
  },
  {
    path: 'petty-cash/transfer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/petty-cash/petty-cash-transfer/petty-cash-transfer.component').then(m => m.PettyCashTransferComponent)
  },
  {
    path: 'petty-cash/balances',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Accountant'] },
    loadComponent: () => import('./features/petty-cash/petty-cash-balances/petty-cash-balances.component').then(m => m.PettyCashBalancesComponent)
  },
  {
    path: '**',
    redirectTo: '/expenses'
  }
]; 