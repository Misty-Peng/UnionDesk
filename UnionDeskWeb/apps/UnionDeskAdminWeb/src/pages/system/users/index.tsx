import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BusinessDomainView,
  CreateIamUserPayload,
  IamRole,
  IamUser,
  UpdateIamUserPayload
} from "@uniondesk/shared";
import {
  PermissionAction,
  createUser,
  fetchDomains,
  fetchRoles,
  fetchUsers,
  offboardUser,
  updateUser
} from "@uniondesk/shared";

type UserFormValues = {
  username: string;
  mobile: string;
  email?: string;
  password?: string;
  accountType: "admin" | "customer";
  roleCodes: string[];
  businessDomainIds: number[];
  status: number;
};

const UsersPage: React.FC = () => {
  const [form] = Form.useForm<UserFormValues>();
  const [users, setUsers] = useState<IamUser[]>([]);
  const [roles, setRoles] = useState<IamRole[]>([]);
  const [domains, setDomains] = useState<BusinessDomainView[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IamUser | null>(null);
  const [offboardReason, setOffboardReason] = useState("");
  const [offboardTarget, setOffboardTarget] = useState<IamUser | null>(null);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: `${role.name} (${role.code})`, value: role.code })),
    [roles]
  );
  const domainOptions = useMemo(
    () => domains.map((domain) => ({ label: `${domain.name} (${domain.code})`, value: domain.id })),
    [domains]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, roleData, domainData] = await Promise.all([fetchUsers(), fetchRoles(), fetchDomains()]);
      setUsers(userData);
      setRoles(roleData);
      setDomains(domainData);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载用户失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      username: "",
      mobile: "",
      email: "",
      password: "",
      accountType: "admin",
      roleCodes: [],
      businessDomainIds: domains.length > 0 ? [domains[0].id] : [],
      status: 1
    });
    setOpen(true);
  };

  const openEdit = (record: IamUser) => {
    setEditing(record);
    form.setFieldsValue({
      username: record.username,
      mobile: record.mobile,
      email: record.email ?? "",
      password: "",
      accountType: (record.accountType === "customer" ? "customer" : "admin") as "admin" | "customer",
      roleCodes: record.roleCodes,
      businessDomainIds: record.businessDomainIds,
      status: record.status
    });
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (editing) {
        const payload: UpdateIamUserPayload = {
          username: values.username,
          mobile: values.mobile,
          email: values.email || null,
          accountType: values.accountType,
          roleCodes: values.roleCodes,
          businessDomainIds: values.businessDomainIds,
          status: values.status
        };
        if (values.password) {
          payload.password = values.password;
        }
        await updateUser(editing.id, payload);
      } else {
        const payload: CreateIamUserPayload = {
          username: values.username,
          mobile: values.mobile,
          email: values.email || null,
          password: values.password || "",
          accountType: values.accountType,
          roleCodes: values.roleCodes,
          businessDomainIds: values.businessDomainIds
        };
        await createUser(payload);
      }
      setOpen(false);
      message.success("保存成功");
      await loadData();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const onOffboard = async () => {
    if (!offboardTarget) {
      return;
    }
    try {
      await offboardUser(offboardTarget.id, offboardReason);
      message.success("已离职");
      setOffboardTarget(null);
      setOffboardReason("");
      await loadData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "离职失败");
    }
  };

  const columns: ColumnsType<IamUser> = [
    { title: "用户名", dataIndex: "username" },
    { title: "手机号", dataIndex: "mobile" },
    { title: "邮箱", dataIndex: "email", render: (value?: string | null) => value ?? "-" },
    { title: "账号类型", dataIndex: "accountType" },
    { title: "角色", dataIndex: "roleCodes", render: (value: string[]) => value.join(", ") || "-" },
    { title: "业务域", dataIndex: "businessDomainIds", render: (value: number[]) => value.join(", ") || "-" },
    { title: "状态", dataIndex: "status", render: (value: number) => (value === 1 ? "启用" : "停用") },
    {
      title: "操作",
      width: 260,
      render: (_, record) => (
        <Space>
          <PermissionAction code="action.iam.users.update">
            <Button type="link" onClick={() => openEdit(record)}>
              编辑
            </Button>
          </PermissionAction>
          <PermissionAction code="action.iam.users.offboard">
            <Popconfirm title="确认将该用户标记为离职吗？" onConfirm={() => setOffboardTarget(record)}>
              <Button type="link" danger>
                离职
              </Button>
            </Popconfirm>
          </PermissionAction>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <PermissionAction code="action.iam.users.create">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建用户
          </Button>
        </PermissionAction>
        <Button onClick={() => void loadData()}>刷新</Button>
      </Space>

      <Table<IamUser> rowKey="id" loading={loading} columns={columns} dataSource={users} />

      <Modal
        title={editing ? "编辑用户" : "新建用户"}
        open={open}
        onOk={() => void onSave()}
        onCancel={() => setOpen(false)}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="mobile" rules={[{ required: true, message: "请输入手机号" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item
            label={editing ? "密码（留空表示不修改）" : "密码"}
            name="password"
            rules={editing ? [] : [{ required: true, message: "请输入密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="账号类型" name="accountType" rules={[{ required: true, message: "请选择账号类型" }]}>
            <Select options={[{ label: "管理账号", value: "admin" }, { label: "客户账号", value: "customer" }]} />
          </Form.Item>
          <Form.Item label="角色" name="roleCodes" rules={[{ required: true, message: "请选择角色" }]}>
            <Select mode="multiple" options={roleOptions} />
          </Form.Item>
          <Form.Item label="业务域" name="businessDomainIds" rules={[{ required: true, message: "请选择业务域" }]}>
            <Select mode="multiple" options={domainOptions} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
            <Select options={[{ label: "启用", value: 1 }, { label: "停用", value: 0 }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={offboardTarget ? `用户离职 - ${offboardTarget.username}` : "用户离职"}
        open={Boolean(offboardTarget)}
        onOk={() => void onOffboard()}
        onCancel={() => {
          setOffboardTarget(null);
          setOffboardReason("");
        }}
      >
        <Input.TextArea
          rows={3}
          value={offboardReason}
          onChange={(event) => setOffboardReason(event.target.value)}
          placeholder="请输入离职原因（可选）"
        />
      </Modal>
    </div>
  );
};

export default UsersPage;
