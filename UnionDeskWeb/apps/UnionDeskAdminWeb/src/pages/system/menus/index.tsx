import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateMenuPayload, MenuTreeNode, UpdateMenuPayload } from "@uniondesk/shared";
import { PermissionAction, createMenu, deleteMenu, fetchMenusTree, updateMenu } from "@uniondesk/shared";

type MenuRow = MenuTreeNode & { depth: number };

type MenuFormValues = {
  resourceCode: string;
  resourceName: string;
  path: string;
  clientScope: string;
  parentId?: number;
  orderNo?: number;
  icon?: string;
  component?: string;
  hidden: boolean;
  status: number;
};

const DEFAULT_FORM_VALUES: MenuFormValues = {
  resourceCode: "",
  resourceName: "",
  path: "",
  clientScope: "ud-admin-web",
  orderNo: 0,
  hidden: false,
  status: 1
};

function flattenMenus(nodes: MenuTreeNode[], depth = 0): MenuRow[] {
  const rows: MenuRow[] = [];
  for (const node of nodes) {
    rows.push({ ...node, depth });
    if (node.children.length > 0) {
      rows.push(...flattenMenus(node.children, depth + 1));
    }
  }
  return rows;
}

const MenusPage: React.FC = () => {
  const [form] = Form.useForm<MenuFormValues>();
  const [menus, setMenus] = useState<MenuTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuTreeNode | null>(null);
  const rows = useMemo(() => flattenMenus(menus), [menus]);

  const parentOptions = useMemo(
    () =>
      rows.map((item) => ({
        label: `${"  ".repeat(item.depth)}${item.name}`,
        value: item.id
      })),
    [rows]
  );

  const loadMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMenusTree("ud-admin-web");
      setMenus(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载菜单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(DEFAULT_FORM_VALUES);
    setOpen(true);
  };

  const openEdit = (record: MenuTreeNode) => {
    setEditing(record);
    form.setFieldsValue({
      resourceCode: record.code,
      resourceName: record.name,
      path: record.path,
      clientScope: record.clientScope,
      parentId: record.parentId ?? undefined,
      orderNo: record.orderNo,
      icon: record.icon ?? undefined,
      component: record.component ?? undefined,
      hidden: record.hidden,
      status: record.status
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (editing) {
        const payload: UpdateMenuPayload = values;
        await updateMenu(editing.id, payload);
      } else {
        const payload: CreateMenuPayload = values;
        await createMenu(payload);
      }
      setOpen(false);
      form.resetFields();
      await loadMenus();
      message.success("保存成功");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      message.success("删除成功");
      await loadMenus();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const columns: ColumnsType<MenuRow> = [
    {
      title: "名称",
      dataIndex: "name",
      render: (_, record) => <span style={{ paddingLeft: record.depth * 16 }}>{record.name}</span>
    },
    {
      title: "编码",
      dataIndex: "code"
    },
    {
      title: "路径",
      dataIndex: "path"
    },
    {
      title: "组件",
      dataIndex: "component",
      render: (value?: string | null) => value ?? "-"
    },
    {
      title: "排序",
      dataIndex: "orderNo",
      width: 80
    },
    {
      title: "隐藏",
      dataIndex: "hidden",
      width: 80,
      render: (value: boolean) => (value ? "是" : "否")
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <PermissionAction code="action.iam.menus.update">
            <Button type="link" onClick={() => openEdit(record)}>
              编辑
            </Button>
          </PermissionAction>
          <PermissionAction code="action.iam.menus.delete">
            <Popconfirm title="确认删除该菜单吗？" onConfirm={() => onDelete(record.id)}>
              <Button danger type="link">
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
        <PermissionAction code="action.iam.menus.create">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建菜单
          </Button>
        </PermissionAction>
        <Button onClick={() => void loadMenus()}>刷新</Button>
      </Space>

      <Table<MenuRow> rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={false} />

      <Modal
        title={editing ? "编辑菜单" : "新建菜单"}
        open={open}
        onOk={() => void onSubmit()}
        onCancel={() => setOpen(false)}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={DEFAULT_FORM_VALUES}>
          <Form.Item label="菜单编码" name="resourceCode" rules={[{ required: true, message: "请输入菜单编码" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="菜单名称" name="resourceName" rules={[{ required: true, message: "请输入菜单名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="菜单路径" name="path" rules={[{ required: true, message: "请输入菜单路径" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="客户端范围" name="clientScope" rules={[{ required: true, message: "请选择客户端范围" }]}>
            <Select
              options={[
                { label: "管理端", value: "ud-admin-web" },
                { label: "客户端", value: "ud-customer-web" },
                { label: "全部", value: "all" }
              ]}
            />
          </Form.Item>
          <Form.Item label="父菜单" name="parentId">
            <Select allowClear options={parentOptions} />
          </Form.Item>
          <Form.Item label="排序" name="orderNo">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="图标" name="icon">
            <Input />
          </Form.Item>
          <Form.Item label="组件" name="component">
            <Input />
          </Form.Item>
          <Form.Item label="启用状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
            <Select options={[{ label: "启用", value: 1 }, { label: "停用", value: 0 }]} />
          </Form.Item>
          <Form.Item label="是否隐藏" name="hidden" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenusPage;
