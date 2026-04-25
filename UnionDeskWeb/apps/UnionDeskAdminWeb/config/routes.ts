export default [
  {
    path: "/user",
    layout: false,
    routes: [
      {
        path: "/user/login",
        layout: false,
        name: "login",
        component: "./user/login"
      },
      {
        path: "/user",
        redirect: "/user/login"
      },
      {
        component: "404",
        path: "/user/*"
      }
    ]
  },
  {
    path: "/dashboard",
    name: "工作台",
    icon: "dashboard",
    routes: [
      {
        path: "/dashboard",
        redirect: "/dashboard/home"
      },
      {
        name: "home",
        icon: "Home",
        path: "/dashboard/home",
        component: "./dashboard/home"
      }
    ]
  },
  {
    path: "/system",
    name: "系统管理",
    icon: "Setting",
    routes: [
      {
        path: "/system",
        redirect: "/system/users"
      },
      {
        path: "/system/menus",
        name: "菜单管理",
        icon: "Menu",
        component: "./system/menus"
      },
      {
        path: "/system/roles",
        name: "角色管理",
        icon: "Team",
        component: "./system/roles"
      },
      {
        path: "/system/users",
        name: "用户管理",
        icon: "User",
        component: "./system/users"
      },
      {
        path: "/system/users/offboard-pool",
        name: "离职池",
        icon: "Delete",
        component: "./system/users/offboard-pool"
      }
    ]
  },
  {
    path: "/",
    redirect: "/dashboard/home"
  },
  {
    component: "404",
    path: "/*"
  }
];
