import { PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { IamResource, IamRole } from "@uniondesk/shared";
import {
  PermissionAction,
  createRole,
  deleteRole,
  fetchIamResources,
  fetchRolePermissions,
  fetchRoles,
  updateRole,
  updateRolePermissions
} from "@uniondesk/shared";

type RoleFormValues = {
  code: string;
  name: string;
  scope: "global" | "domain";
};

const DEFAULT_ROLE_VALUES: RoleFormValues = {
  code: "",
  name: "",
  scope: "domain"
};

const RolesPage: React.FC = () => {
  const [form] = Form.useForm<RoleFormValues>();
  const [roles, setRoles] = useState<IamRole[]>([]);
  const [resources, setResources] = useState<IamResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IamRole | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<IamRole | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);

  const menuOptions = useMemo(
    () =>
      resources
        .filter((resource) => resource.resourceType === "menu")
        .map((resource) => ({ label: `${resource.resourceName} (${resource.resourceCode})`, value: resource.id })),
    [resources]
  );
  const actionOptions = useMemo(
    () =>
      resources
        .filter((resource) => resource.resourceType === "action" || resource.resourceType === "api")
        .map((resource) => ({ label: `${resource.resourceName} (${resource.resourceCode})`, value: resource.id })),
    [resources]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [roleData, resourceData] = await Promise.all([fetchRoles(), fetchIamResources()]);
      setRoles(roleData);
      setResources(resourceData);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载角色失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(DEFAULT_ROLE_VALUES);
    setOpen(true);
  };

  const openEdit = (record: IamRole) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      scope: (record.scope === "global" ? "global" : "domain") as "global" | "domain"
    });
    setOpen(true);
  };

  const onSaveRole = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (editing) {
        await updateRole(editing.id, values);
      } else {
        await createRole(values);
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

  const onDeleteRole = async (roleId: number) => {
    try {
      await deleteRole(roleId);
      message.success("删除成功");
      await loadData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除角色失败");
    }
  };

  const openPermissionModal = async (record: IamRole) => {
    setActiveRole(record);
    try {
      const permissions = await fetchRolePermissions(record.id);
      setSelectedMenuIds(permissions.menuResourceIds);
      setSelectedActionIds(permissions.actionResourceIds);
      setPermissionOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载授权失败");
    }
  };

  const savePermissions = async () => {
    if (!activeRole) {
      return;
    }
    try {
      setPermissionSaving(true);
      await updateRolePermissions(activeRole.id, {
        menuResourceIds: selectedMenuIds,
        actionResourceIds: selectedActionIds
      });
      message.success("权限已更新");
      setPermissionOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存授权失败");
    } finally {
      setPermissionSaving(false);
    }
  };

  const columns: ColumnsType<IamRole> = [
    { title: "角色编码", dataIndex: "code" },
    { title: "角色名称", dataIndex: "name" },
    { title: "作用域", dataIndex: "scope" },
    {
      title: "系统角色",
      dataIndex: "system",
      render: (value: boolean) => (value ? "是" : "否")
    },
    {
      title: "操作",
      width: 300,
      render: (_, record) => (
        <Space>
          <PermissionAction code="action.iam.role_permissions.update">
            <Button type="link" onClick={() => void openPermissionModal(record)}>
              授权
            </Button>
          </PermissionAction>
          <PermissionAction code="action.iam.roles.update">
            <Button type="link" disabled={record.system} onClick={() => openEdit(record)}>
              编辑
            </Button>
          </PermissionAction>
          <PermissionAction code="action.iam.roles.delete">
            <Popconfirm title="确认删除该角色吗？" onConfirm={() => void onDeleteRole(record.id)}>
              <Button type="link" danger disabled={record.system}>
                删除
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
        <PermissionAction code="action.iam.roles.create">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建角色
          </Button>
        </PermissionAction>
        <Button onClick={() => void loadData()}>刷新</Button>
      </Space>

      <Table<IamRole> rowKey="id" loading={loading} columns={columns} dataSource={roles} />

      <Modal
        title={editing ? "编辑角色" : "新建角色"}
        open={open}
        onOk={() => void onSaveRole()}
        onCancel={() => setOpen(false)}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={DEFAULT_ROLE_VALUES}>
          <Form.Item label="角色编码" name="code" rules={[{ required: true, message: "请输入角色编码" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: "请输入角色名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="作用域" name="scope" rules={[{ required: true, message: "请选择作用域" }]}>
            <Select options={[{ label: "全局", value: "global" }, { label: "业务域", value: "domain" }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={activeRole ? `角色授权 - ${activeRole.name}` : "角色授权"}
        open={permissionOpen}
        onOk={() => void savePermissions()}
        onCancel={() => setPermissionOpen(false)}
        confirmLoading={permissionSaving}
        width={920}
        destroyOnClose
      >
        <Tabs
          items={[
            {
              key: "menus",
              label: "菜单权限",
              children: (
                <Checkbox.Group
                  style={{ width: "100%" }}
                  value={selectedMenuIds}
                  options={menuOptions}
                  onChange={(checked) => setSelectedMenuIds(checked as number[])}
                />
              )
            },
            {
              key: "actions",
              label: "按钮/API权限",
              children: (
                <Checkbox.Group
                  style={{ width: "100%" }}
                  value={selectedActionIds}
                  options={actionOptions}
                  onChange={(checked) => setSelectedActionIds(checked as number[])}
                />
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default RolesPage;
